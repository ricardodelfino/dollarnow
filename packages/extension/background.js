import { currencyMetadata, ASSET_SYMBOLS } from './lib/constants.js';
const WORKER_URL = 'https://dollarnow.21m.workers.dev/';

// --- Data Fetching Logic (now via Worker) ---

async function fetchRatesFromWorker() {
    try {
        const response = await fetch(WORKER_URL);
        if (!response.ok) {
            throw new Error(`Worker returned status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Rates fetched from Cloudflare Worker', data);
        if (!data.success || !data.rates) throw new Error('Worker reported an error or missing rates');
        return data; // Return the full data object
    } catch (error) {
        console.error('Failed to fetch rates from Worker. URL:', WORKER_URL, 'Error:', error);
        return null; // Return null on failure
    }
}

// --- Main Update Logic ---

async function updateRates() {
    console.log('Updating rates...');
    const data = await fetchRatesFromWorker();

    if (!data) {
        updateBadgeText('ERR');
        return;
    }

    await chrome.storage.local.set({ rates: data.rates, updatedAt: data.updated_at });
    await updateBadge();
    await checkAlerts(data.rates);
}

// --- Badge Logic ---

// Number formatter for the badge, respecting the user's locale
const userLocaleForBadge = chrome.i18n.getUILanguage();
const badgeNumberFormatter = new Intl.NumberFormat(userLocaleForBadge, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function formatBadgeText(value, format = 'compact_k_int') {
    // For values < 1000, use the local formatter (e.g., 5.73 for en-US)
    if (value < 1000) return badgeNumberFormatter.format(value);

    // For values >= 1000, use the more compact 'k' notation
    switch (format) {
        case 'full': // E.g., 112456
            return String(Math.floor(value));
        case 'full_thousands': // E.g., 112
            return String(Math.floor(value / 1000));
        case 'compact_k_float': // E.g., 112.4k
            return (value / 1000).toFixed(1) + 'k';
        case 'compact_k_int': // E.g., 112k (Default)
        default:
            return Math.round(value / 1000) + 'k';
    }
}

async function updateBadge() {
    const { rates, selectedCurrency = 'EUR', inverted = false, badgeFormats = {} } = await chrome.storage.local.get(['rates', 'selectedCurrency', 'inverted', 'badgeFormats']);
    
    if (!rates || typeof rates[selectedCurrency] === 'undefined') {
        updateBadgeText('...');
        return;
    }

    const rate = rates[selectedCurrency];
    let valueToShow;

    if (inverted) { // Moeda -> USD
        valueToShow = 1 / rate;
    } else { // USD -> Moeda
        valueToShow = rate;
    }
    
    const defaultFormat = 'compact_k_int';
    const format = badgeFormats[selectedCurrency] || defaultFormat;
    updateBadgeText(formatBadgeText(valueToShow, format));
}

function updateBadgeText(text) {
    chrome.action.setBadgeText({ text: String(text) });
    chrome.action.setBadgeBackgroundColor({ color: '#163300' }); // New color
    chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
}

// --- Alert Logic ---

function formatAlertRate(rate, locale) {
    if (rate > 999) {
        return Math.floor(rate).toLocaleString(locale);
    }
    return rate.toFixed(4);
}

async function showVisualAlert(alertData, currentRate, date, time) {
    // Pass all necessary data to the alert window via URL parameters
    const params = new URLSearchParams({
        base: alertData.base,
        quote: alertData.quote,
        condition: alertData.condition,
        targetValue: alertData.value,
        currentRate: formatAlertRate(currentRate, userLocaleForBadge)
    });
    const url = `alert.html?${params.toString()}`;

    // Check if an alert window is already open to avoid creating multiple ones
    const windows = await chrome.windows.getAll({ populate: true, windowTypes: ['popup'] });
    const existingAlertWindow = windows.find(win => 
        win.tabs && win.tabs.some(tab => tab.url && tab.url.includes('alert.html'))
    );

    if (existingAlertWindow) {
        // If the window already exists, just focus it
        await chrome.windows.update(existingAlertWindow.id, { focused: true });
    } else {
        // Create a new small window (popup)
        await chrome.windows.create({
            url: url,
            type: 'popup',
            width: 340,
            height: 340,
            focused: true
        });
    }
}

async function checkAlerts(currentRates) {
    const { alerts } = await chrome.storage.local.get({ alerts: [] });
    if (!alerts || alerts.length === 0) return;

    let alertsModified = false;
    for (const alert of alerts) {
        if (!alert.enabled) continue;

        // Check for cooldown period on permanent alerts
        if (alert.isPermanent && alert.lastReached) {
            const cooldownMinutes = alert.cooldown || 60; // Default to 60 mins if not set
            const cooldownMillis = cooldownMinutes * 60 * 1000;
            const timeSinceLastAlert = Date.now() - alert.lastReached;
            if (timeSinceLastAlert < cooldownMillis) continue; // Skip if within cooldown
        }

        let rateToCheck;
        if (alert.base === 'USD') {
            rateToCheck = currentRates[alert.quote];
        } else {
            rateToCheck = 1 / currentRates[alert.base];
        }
        
        if (typeof rateToCheck === 'undefined') continue;

        let trigger = false;
        if (alert.condition === 'above' && rateToCheck > alert.value) {
            trigger = true;
        } else if (alert.condition === 'below' && rateToCheck < alert.value) {
            trigger = true;
        }

        if (trigger) {
            const now = new Date();
            const formattedDate = now.toLocaleDateString('pt-BR');
            const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            // REPLACED: Instead of creating a system notification, we show our custom window
            await showVisualAlert(alert, rateToCheck, formattedDate, formattedTime);

            alert.lastReached = Date.now();
            alertsModified = true;

            if (!alert.isPermanent) {
                alert.enabled = false;
            }

            if (alert.sound && alert.sound !== 'none') {
                playSound(alert.sound);
            }
        }
    }
    
    if (alertsModified) {
        await chrome.storage.local.set({ alerts });
    }
}

let creating; // Prevents the creation of multiple offscreen documents
async function playSound(soundFile) {
  // Use chrome.runtime.getURL to get the full, accessible path to the sound file.
  const audioPath = chrome.runtime.getURL(`sounds/${soundFile}`);
  
  const sendMessageToOffscreen = () => {
    chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'play-audio',
      data: { path: audioPath }
    });
  };

  if (await chrome.offscreen.hasDocument()) {
    sendMessageToOffscreen();
  } else {
    if (creating) {
      await creating;
    } else {
      creating = chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
        justification: 'To play alert sounds'
      });
      await creating;
      creating = null;
    }
    sendMessageToOffscreen();
  }
}


// --- Chrome Event Management ---

// A simple map to associate country codes from browser locales to currency codes.
const localeToCurrencyMap = {
	AU: 'AUD', BR: 'BRL', CA: 'CAD', CH: 'CHF', CN: 'CNY',
	GB: 'GBP', HK: 'HKD', ID: 'IDR', IN: 'INR', JP: 'JPY',
	MX: 'MXN', NZ: 'NZD', PK: 'PKR', SE: 'SEK', US: 'USD'
};

function detectInitialCurrency() {
    // chrome.i18n.getUILanguage() is the most reliable way to get the browser's UI language in an extension.
    const userLocale = chrome.i18n.getUILanguage(); // e.g., "pt-BR", "en-US"
    const localeParts = userLocale.split('-');
    const countryCode = localeParts[localeParts.length - 1].toUpperCase();

    let detectedCurrency = localeToCurrencyMap[countryCode];

    // Special case for Eurozone countries
    if (!detectedCurrency && new Intl.NumberFormat(userLocale, { style: 'currency', currency: 'EUR' }).format(1).includes('€')) {
        detectedCurrency = 'EUR';
    }

    // Use the detected currency only if it's one we support. Otherwise, fallback to EUR.
    if (detectedCurrency && currencyMetadata[detectedCurrency]) {
        return detectedCurrency;
    }

    return 'EUR'; // Default fallback
}

chrome.runtime.onInstalled.addListener(async () => {
    // On first install, detect the user's currency.
    // If they already have settings, this won't overwrite them.
    const initialCurrency = detectInitialCurrency();
    const isAsset = ASSET_SYMBOLS.includes(initialCurrency);

    await chrome.storage.local.set({
        selectedCurrency: initialCurrency,
        inverted: isAsset, // Invert view by default for assets like BTC
        rates: {},
        theme: 'system',
        alerts: [],
        badgeFormats: {}
    });

    await updateRates();
    
    chrome.alarms.create('update-rates', {
        delayInMinutes: 1,
        periodInMinutes: 1
    });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'update-rates') {
        await updateRates();
    }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'updateBadge') {
        await updateBadge();
    } else if (message.action === 'testSound' && message.soundFile) {
        await playSound(message.soundFile);
    } else if (message.action === 'openOptionsPage') {
        chrome.runtime.openOptionsPage();
    }
});
