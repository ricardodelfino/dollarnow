import type { PageLoad } from './$types';
import { currencyMetadata } from 'shared';


export const load: PageLoad = async ({ fetch }) => {
	// The URL now points to your new resilient Worker.
	const API_URL = 'https://dollarnow.21m.workers.dev/';

	try {
		const response = await fetch(API_URL);

		if (!response.ok) {
			throw new Error(`Failed to fetch rates: ${response.statusText}`);
		}

		const data = await response.json();

		if (!data.success) {
			throw new Error('API request was not successful.');
		}

		// Return the data for the Svelte page to use.
		return {
			rates: data.rates,
			metadata: currencyMetadata,
			// The API returns a Unix timestamp in seconds.
			// Check if it is a valid and positive number before converting to milliseconds.
			updatedAt: typeof data.updated_at === 'number' && data.updated_at > 0 ? data.updated_at * 1000 : undefined
		};
	} catch (error) {
		// Log the error on the server (during SSR) and in the browser console (on the client).
		if (error instanceof Error) {
			console.error('Error loading currency data:', error.message);
		}
		// Return an error state that the page can display.
		return { error: 'Could not load currency data. Please try again later.' };
	}
};