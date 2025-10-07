// Currency metadata, ensuring correct names and paths for the flags.
export const currencyMetadata = {
	USD: { name: 'United States Dollar', flag: '/flags/usd.svg' },
	BRL: { name: 'Brazilian Real', flag: '/flags/brl.svg' },
	EUR: { name: 'Euro', flag: '/flags/eur.svg' },
	GBP: { name: 'British Pound', flag: '/flags/gbp.svg' },
	JPY: { name: 'Japanese Yen', flag: '/flags/jpy.svg' },
	AUD: { name: 'Australian Dollar', flag: '/flags/aud.svg' },
	CAD: { name: 'Canadian Dollar', flag: '/flags/cad.svg' },
	CHF: { name: 'Swiss Franc', flag: '/flags/chf.svg' },
	CNY: { name: 'Chinese Yuan', flag: '/flags/cny.svg' },
	HKD: { name: 'Hong Kong Dollar', flag: '/flags/hkd.svg' },
	NZD: { name: 'New Zealand Dollar', flag: '/flags/nzd.svg' },
	SEK: { name: 'Swedish Krona', flag: '/flags/sek.svg' },
	INR: { name: 'Indian Rupee', flag: '/flags/inr.svg' },
	PKR: { name: 'Pakistani Rupee', flag: '/flags/pkr.svg' },
	IDR: { name: 'Indonesian Rupiah', flag: '/flags/idr.svg' },
	MXN: { name: 'Mexican Peso', flag: '/flags/mxn.svg' },
	// Assets
	BTC: { name: 'Bitcoin', flag: '/flags/btc.svg' },
	XAU: { name: 'Gold (Ounce)', flag: '/flags/xau.svg' },
	XAG: { name: 'Silver (Ounce)', flag: '/flags/xag.svg' },
	XBR: { name: 'Brent Oil (Barrel)', flag: '/flags/xbr.svg' }
};

// Lists for categorization. BTC is in both to appear in "Currencies" but behave as an "Asset".
export const FIAT_SYMBOLS = ['BRL', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'NZD', 'SEK', 'INR', 'PKR', 'IDR', 'MXN', 'BTC'];
export const ASSET_SYMBOLS = ['BTC', 'XAU', 'XAG', 'XBR'];
export const ALL_CURRENCIES = Object.keys(currencyMetadata);
