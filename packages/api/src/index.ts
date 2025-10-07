/**
 * DollarNow Resilient API Fetcher v5.0 with History
 *
 * This Worker fetches currency exchange rates and standardizes them against a USD base.
 * All returned rates represent how many units of that currency/asset can be bought with 1 USD.
 * It prioritizes the Wise API for FIAT currencies and falls back to AwesomeAPI.
 * It also stores and retrieves historical data from Cloudflare KV for percentage variation alerts.
 */
import { FIAT_SYMBOLS, ASSET_SYMBOLS } from 'shared';

// --- Type Definitions ---
export interface Env {
	AWESOME_API_TOKEN: string;
	WISE_API_KEY: string;
	ALPHAVANTAGE_API_KEY: string;
	DOLLARNOW_RATES_HISTORY_2MIN: KVNamespace;
	DOLLARNOW_RATES_HISTORY_DAILY: KVNamespace;
}

interface WiseQuote {
    sourceAmount: number;
    targetAmount: number;
    rate: number;
    // ... other properties
}

interface AwesomeApiItem {
    code: string;
    codein: string;
    name: string;
    bid: string;
    timestamp: string;
}

interface AwesomeApiResponse {
    [key: string]: AwesomeApiItem;
}

type Rates = { [key: string]: number };

type HistoryEntry = {
    timestamp: number;
    rates: Rates;
};

// --- Fetcher Functions ---

/**
 * Fetches FIAT rates from the Wise API.
 * Wise provides direct conversion rates, which are highly reliable.
 */
async function fetchFiatFromWise(symbols: string[], apiKey: string): Promise<Rates> {
    console.log('Attempting to fetch FIAT rates from Wise...');
    const rates: Rates = {};
    // The /v1/rates endpoint is simpler and doesn't require a profile ID.
    const quotePromises = symbols
        .filter(symbol => symbol !== 'USD')
        .map(symbol => {
            // Construct the URL for the rates endpoint
            const url = `https://api.wise.com/v1/rates?source=USD&target=${symbol}`;
            return fetch(url, {
                headers: { Authorization: `Bearer ${apiKey}` },
            })
            .then(response => {
                if (!response.ok) {
                    console.warn(`Wise API failed for ${symbol} with status: ${response.status}`);
                    return null;
                }
                return response.json();
            })
            .then((rateData: any[] | null) => {
                // The v1/rates endpoint returns an array of rates. We take the first one.
                if (rateData && rateData.length > 0 && rateData[0].rate) {
                    rates[symbol] = rateData[0].rate;
                }
            })
            .catch(error => console.error(`Error fetching ${symbol} from Wise:`, error));
        });

    await Promise.all(quotePromises);
    console.log(`Successfully fetched ${Object.keys(rates).length} FIAT rates from Wise.`);
    return rates;
}

/**
 * Fetches rates from AwesomeAPI. Used for assets and as a fallback for FIAT.
 */
async function fetchFromAwesomeApi(fiatSymbols: string[], assetSymbols: string[], apiToken: string): Promise<Rates> {
    console.log('Attempting to fetch rates from AwesomeAPI...');
    const fiatPairs = fiatSymbols.map((s) => `USD-${s}`);
    const assetPairs = assetSymbols.map((s) => `${s}-USD`);
    const allPairs = [...fiatPairs, ...assetPairs].join(',');

    // If there are no pairs to fetch, return early.
    if (!allPairs) return {};

    const response = await fetch(`https://economia.awesomeapi.com.br/json/last/${allPairs}?token=${apiToken}`);
    if (!response.ok) {
        throw new Error(`AwesomeAPI request failed with status ${response.status}`);
    }

    const data: AwesomeApiResponse = await response.json();
    const rates: Rates = {};

    for (const item of Object.values(data)) {
        const value = parseFloat(item.bid);
        if (isNaN(value)) continue;

        if (item.code === 'USD') {
            // It's a fiat currency (e.g., USD-BRL), the value is correct.
            rates[item.codein] = value;
        } else {
            // It's an asset (e.g., BTC-USD), we need to invert the value.
            // 1 / (USD per Asset) = Assets per USD
            rates[item.code] = 1 / value;
        }
    }
    console.log(`Successfully fetched ${Object.keys(rates).length} rates from AwesomeAPI.`);
    return rates;
}

/**
 * Fetches FIAT rates from Alpha Vantage as a final fallback.
 */
async function fetchFromAlphaVantage(symbols: string[], apiKey: string): Promise<Rates> {
    console.log('Attempting to fetch rates from Alpha Vantage as final fallback...');
    const rates: Rates = {};

    // Alpha Vantage API has a low rate limit, so we fetch one by one with a small delay.
    // This is acceptable for a last-resort fallback.
    for (const symbol of symbols) {
        if (symbol === 'USD') continue;
        try {
            const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=${symbol}&apikey=${apiKey}`;
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Alpha Vantage API failed for ${symbol} with status: ${response.status}`);
                continue;
            }
            const data = await response.json();
            const rateValue = data?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate'];
            if (rateValue) {
                rates[symbol] = parseFloat(rateValue);
            } else {
                console.warn(`Alpha Vantage did not return a rate for ${symbol}. Response:`, data);
            }
            // Add a small delay to respect potential rate limits on free tiers.
            await new Promise(resolve => setTimeout(resolve, 250));
        } catch (error) {
            console.error(`Error fetching ${symbol} from Alpha Vantage:`, error);
        }
    }

    console.log(`Successfully fetched ${Object.keys(rates).length} rates from Alpha Vantage.`);
    return rates;
}


/**
 * Fetches current rates from primary and fallback sources.
 */
async function fetchAllCurrentRates(env: Env): Promise<Rates> {
    // Ensure we only ask Wise for actual FIAT currencies, excluding assets like BTC.
    const fiatSymbolsForWise = FIAT_SYMBOLS.filter(s => !ASSET_SYMBOLS.includes(s));

    const wiseFiatRates = await fetchFiatFromWise(fiatSymbolsForWise, env.WISE_API_KEY);

    let finalRates: Rates = { USD: 1, ...wiseFiatRates };

    // Check if Wise returned any rates.
    if (Object.keys(wiseFiatRates).length > 0) {
        // Wise worked, so just fetch assets from AwesomeAPI.
        const awesomeAssetRates = await fetchFromAwesomeApi([], ASSET_SYMBOLS, env.AWESOME_API_TOKEN);
        finalRates = { ...finalRates, ...awesomeAssetRates };
    } else {
        // Wise failed completely. Fallback to AwesomeAPI for all remaining symbols.
        console.log('Wise fetch failed. Falling back to AwesomeAPI for all remaining symbols.');
        const missingFiatSymbols = FIAT_SYMBOLS.filter(s => !finalRates[s]);
        try {
            const awesomeFallbackRates = await fetchFromAwesomeApi(missingFiatSymbols, ASSET_SYMBOLS, env.AWESOME_API_TOKEN);
            finalRates = { ...finalRates, ...awesomeFallbackRates };
        } catch (awesomeError) {
            console.error('AwesomeAPI fallback also failed. Attempting final fallback to Alpha Vantage for FIAT.', awesomeError);
            const missingFiatForAlpha = FIAT_SYMBOLS.filter(s => !finalRates[s]);
            const alphaVantageRates = await fetchFromAlphaVantage(missingFiatForAlpha, env.ALPHAVANTAGE_API_KEY);
            finalRates = { ...finalRates, ...alphaVantageRates };
        }
    }

    return finalRates;
}

// --- History Management ---

/**
 * Updates a KV history store by adding a new entry and pruning old ones.
 * This is much more efficient than using list() + multiple get/put operations.
 * @param kv The KV namespace to update.
 * @param key The single key holding the history array.
 * @param newEntry The new rate object to add.
 * @param maxAgeSeconds The maximum age for entries to keep in the history.
 */
async function updateAndPruneHistory(kv: KVNamespace, key: string, newEntry: HistoryEntry, maxAgeSeconds: number) {
    // 1. Get the existing history array, or start with an empty one.
    const currentHistory: HistoryEntry[] = (await kv.get(key, 'json')) || [];

    // 2. Add the new entry.
    currentHistory.push(newEntry);

    // 3. Filter out old entries.
    const cutoffTimestamp = Date.now() - maxAgeSeconds * 1000;
    const prunedHistory = currentHistory.filter(entry => entry.timestamp >= cutoffTimestamp);

    // 4. Put the updated and pruned array back into KV.
    await kv.put(key, JSON.stringify(prunedHistory));
}

// --- Main Worker Logic ---
export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const cacheKey = new Request(request.url, request);
        const cache = caches.default;

        let response = await cache.match(cacheKey);
        if (response) {
            console.log('Cache hit!');
            return new Response(response.body, response);
        }
        console.log('Cache miss. Fetching fresh rates...');

        try {
            const currentRates = await fetchAllCurrentRates(env);
            const now = Date.now();
            const timestamp = Math.floor(now / 1000);

            const newHistoryEntry: HistoryEntry = { timestamp: now, rates: currentRates };

            // Asynchronously update the 2-min history KV.
            ctx.waitUntil(
                updateAndPruneHistory(env.DOLLARNOW_RATES_HISTORY_2MIN, 'history_2min', newHistoryEntry, 24 * 60 * 60) // 24h TTL
            );

            // Fetch historical data from both KVs using a single GET for each.
            const [history2min, historyDaily] = await Promise.all([
                env.DOLLARNOW_RATES_HISTORY_2MIN.get<HistoryEntry[]>('history_2min', 'json'),
                env.DOLLARNOW_RATES_HISTORY_DAILY.get<HistoryEntry[]>('history_daily', 'json')
            ]);

            const responsePayload = {
                success: true,
                rates: currentRates,
                history: {
                    "2min": history2min || [],
                    "daily": historyDaily || []
                },
                updated_at: timestamp
            };

            response = new Response(JSON.stringify(responsePayload), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=90'
                }
            });

            ctx.waitUntil(cache.put(cacheKey, response.clone()));
            return response;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return new Response(JSON.stringify({ success: false, error: errorMessage }), {
                status: 503,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }
    },

    async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
        console.log('Running scheduled task to save daily rate...');
        try {
            const currentRates = await fetchAllCurrentRates(env);
            const now = new Date();
            now.setUTCHours(0, 0, 0, 0); // Normalize to the beginning of the day UTC
            const timestamp = now.getTime();

            const newDailyEntry: HistoryEntry = { timestamp, rates: currentRates };

            // Update the daily history, keeping entries for the last 31 days.
            await updateAndPruneHistory(env.DOLLARNOW_RATES_HISTORY_DAILY, 'history_daily', newDailyEntry, 31 * 24 * 60 * 60); // 31-day TTL
            console.log('Successfully saved daily rate for', now.toUTCString());
        } catch (error) {
            console.error('Failed to save daily rate:', error);
        }
    }
};