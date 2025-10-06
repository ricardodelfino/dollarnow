/**
 * Creates a reusable number formatter based on a given locale.
 * @param {string} locale - The user's locale (e.g., 'pt-BR', 'en-US').
 * @param {Intl.NumberFormatOptions} defaultOptions - Default options for the formatter.
 * @returns {(number: number, options?: Intl.NumberFormatOptions) => string} A function that formats a number.
 */
export function createLocalizedNumberFormatter(locale, defaultOptions) {
	return (number, options = {}) => {
		try {
			return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(number);
		} catch (e) {
			console.error(`Failed to format number for locale ${locale}`, e);
			// Fallback to a simple fixed format if Intl fails
			return number.toFixed(defaultOptions.maximumFractionDigits || 2);
		}
	};
}

export function parseLocalizedNumber(str, locale) {
	const thousandSeparator = (1111).toLocaleString(locale).substring(1, 2);
	const decimalSeparator = (1.1).toLocaleString(locale).substring(1, 2);
	return parseFloat(String(str).replace(new RegExp(`\\${thousandSeparator}`, 'g'), '').replace(new RegExp(`\\${decimalSeparator}`), '.'));
}