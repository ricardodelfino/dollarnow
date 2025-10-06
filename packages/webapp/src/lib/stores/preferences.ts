import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { currencyMetadata, ASSET_SYMBOLS } from 'shared';

export type UserPreferences = {
	currency: string;
	inverted: boolean;
};

const defaultPreferences: UserPreferences = {
	currency: 'BRL', // Default currency
	inverted: false
};

// A simple map to associate country codes from browser locales to currency codes.
const localeToCurrencyMap: Record<string, string> = {
	AU: 'AUD',
	BR: 'BRL',
	CA: 'CAD',
	CH: 'CHF',
	CN: 'CNY',
	GB: 'GBP',
	HK: 'HKD',
	ID: 'IDR',
	IN: 'INR',
	JP: 'JPY',
	MX: 'MXN',
	NZ: 'NZD',
	PK: 'PKR',
	SE: 'SEK',
	US: 'USD'
	// European countries often use EUR, which can be a default for many 'DE', 'FR', 'IT', etc.
	// For simplicity, we'll handle EUR as a special case.
};

function createPreferencesStore() {
	let initialValue = defaultPreferences;

	if (browser) {
		try {
			const storedValue = localStorage.getItem('userPreferences');
			if (storedValue) {
				const parsed = JSON.parse(storedValue);
				// Basic validation to ensure the saved object has the expected format.
				if (typeof parsed === 'object' && parsed !== null && 'currency' in parsed && 'inverted' in parsed) {
					initialValue = parsed;
				}
			} else {
				// No preferences found, this is likely the user's first visit.
				// Let's try to guess the currency from their locale.
				const userLocale = navigator.language; // e.g., "pt-BR", "en-US"
				const localeParts = userLocale.split('-');
				const countryCode = localeParts[localeParts.length - 1].toUpperCase();

				let detectedCurrency = localeToCurrencyMap[countryCode];

				// Special case for Eurozone countries
				if (!detectedCurrency && new Intl.NumberFormat(userLocale, { style: 'currency', currency: 'EUR' }).format(1).includes('€')) {
					detectedCurrency = 'EUR';
				}

				// Use the detected currency only if it's one we support.
				if (detectedCurrency && currencyMetadata[detectedCurrency]) {
					// Set the detected currency and ensure the view is not inverted by default,
					// unless the detected currency is an asset (like BTC).
					const isAsset = ASSET_SYMBOLS.includes(detectedCurrency);
					initialValue = { currency: detectedCurrency, inverted: isAsset };
				}
			}
		} catch (e) {
			console.error('Failed to read user preferences from localStorage, using defaults.', e);
			// If reading fails for any reason, we fall back to the default value.
			initialValue = defaultPreferences;
		}
	}

	const store = writable<UserPreferences>(initialValue);

	// Whenever the store is updated, save it to localStorage (client-side only).
	store.subscribe((value) => {
		if (browser) {
			localStorage.setItem('userPreferences', JSON.stringify(value));
		}
	});

	return store;
}

export const preferences = createPreferencesStore();