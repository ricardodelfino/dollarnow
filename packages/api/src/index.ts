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
 * Fetches the user's personal profile ID from Wise.
 * This is required for creating quotes with the v1 API.
 */
async function getWiseProfileId(apiKey: string): Promise<number | null> {
    try {
        const response = await fetch('https://api.wise.com/v1/profiles', {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!response.ok) return null;
        const profiles = await response.json();
        // Find the personal profile and return its ID
        const personalProfile = profiles.find((p: any) => p.type === 'PERSONAL');
        return personalProfile ? personalProfile.id : null;
    } catch (error) {
        console.error('Failed to fetch Wise profile ID:', error);
        return null;
    }
}

/**
 * Fetches FIAT rates from the Wise API.
 * Wise provides direct conversion rates, which are highly reliable.
 */
async function fetchFiatFromWise(symbols: string[], apiKey: string): Promise<Rates> {
    console.log('Attempting to fetch FIAT rates from Wise...');
 
 
    const profileId = await getWiseProfileId(apiKey);
    if (!profileId) {
        console.error('Could not retrieve a Wise profile ID. Aborting Wise fetch.');
        return {};
    }

    const rates: Rates = {};
    const quotePromises = symbols
        .filter(symbol => symbol !== 'USD')
        .map(symbol => {
            const body = JSON.stringify({
                profile: profileId,
                sourceCurrency: 'USD',
                targetCurrency: symbol,
                sourceAmount: 100, // Use a round number for precision
            });

            return fetch('https://api.wise.com/v1/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: body,
            })
            .then(response => {
                if (!response.ok) {
                    console.warn(`Wise API failed for ${symbol} with status: ${response.status}`);
                    return null;
                }
                return response.json();
            })
            .then((quote: WiseQuote | null) => {
                if (quote && quote.rate) {
                    rates[symbol] = quote.rate;
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
 * Fetches current rates from primary and fallback sources.
 */
async function fetchAllCurrentRates(env: Env): Promise<Rates> {
	// Ensure we only ask Wise for actual FIAT currencies, excluding assets like BTC.
	const fiatSymbolsForWise = FIAT_SYMBOLS.filter(s => !ASSET_SYMBOLS.includes(s));

	const [wiseFiatRates, awesomeAssetRates] = await Promise.all([
		fetchFiatFromWise(fiatSymbolsForWise, env.WISE_API_KEY),
		fetchFromAwesomeApi([], ASSET_SYMBOLS, env.AWESOME_API_TOKEN),
	]);

	let finalRates: Rates = { USD: 1, ...wiseFiatRates, ...awesomeAssetRates };

	const missingFiatSymbols = FIAT_SYMBOLS.filter((s) => !finalRates[s]);
	if (missingFiatSymbols.length > 0) {
		console.log(`Missing ${missingFiatSymbols.length} FIAT rates, falling back to AwesomeAPI for: ${missingFiatSymbols.join(', ')}`);
		const fallbackFiatRates = await fetchFromAwesomeApi(missingFiatSymbols, [], env.AWESOME_API_TOKEN);
		finalRates = { ...finalRates, ...fallbackFiatRates };
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