// Currency metadata, ensuring correct names and paths for the flags.
export const currencyMetadata = {
	USD: { name: 'United States Dollar', flag: '$lib/assets/flags/usd.svg' },
	BRL: { name: 'Brazilian Real', flag: '$lib/assets/flags/brl.svg' },
	EUR: { name: 'Euro', flag: '$lib/assets/flags/eur.svg' },
	GBP: { name: 'British Pound', flag: '$lib/assets/flags/gbp.svg' },
	JPY: { name: 'Japanese Yen', flag: '$lib/assets/flags/jpy.svg' },
	AUD: { name: 'Australian Dollar', flag: '$lib/assets/flags/aud.svg' },
	CAD: { name: 'Canadian Dollar', flag: '$lib/assets/flags/cad.svg' },
	CHF: { name: 'Swiss Franc', flag: '$lib/assets/flags/chf.svg' },
	CNY: { name: 'Chinese Yuan', flag: '$lib/assets/flags/cny.svg' },
	HKD: { name: 'Hong Kong Dollar', flag: '$lib/assets/flags/hkd.svg' },
	NZD: { name: 'New Zealand Dollar', flag: '$lib/assets/flags/nzd.svg' },
	SEK: { name: 'Swedish Krona', flag: '$lib/assets/flags/sek.svg' },
	INR: { name: 'Indian Rupee', flag: '$lib/assets/flags/inr.svg' },
	PKR: { name: 'Pakistani Rupee', flag: '$lib/assets/flags/pkr.svg' },
	IDR: { name: 'Indonesian Rupiah', flag: '$lib/assets/flags/idr.svg' },
	MXN: { name: 'Mexican Peso', flag: '$lib/assets/flags/mxn.svg' },
	// Assets
	BTC: { name: 'Bitcoin', flag: '$lib/assets/flags/btc.svg' },
	XAU: { name: 'Gold (Ounce)', flag: '$lib/assets/flags/xau.svg' },
	XAG: { name: 'Silver (Ounce)', flag: '$lib/assets/flags/xag.svg' },
	XBR: { name: 'Brent Oil (Barrel)', flag: '$lib/assets/flags/xbr.svg' }
};

// Lists for categorization. BTC is in both to appear in "Currencies" but behave as an "Asset".
export const FIAT_SYMBOLS = ['BRL', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD', 'SEK', 'INR', 'PKR', 'IDR', 'MXN', 'BTC'];
export const ASSET_SYMBOLS = ['BTC', 'XAU', 'XAG', 'XBR'];
export const ALL_CURRENCIES = Object.keys(currencyMetadata);
