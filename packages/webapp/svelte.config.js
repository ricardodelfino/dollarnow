import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		files: {
			// This tells SvelteKit to treat the shared 'assets' package as its static directory.
			assets: '../assets'
		},
		alias: {
			// This is the SvelteKit-native way to handle monorepo package aliases.
			'shared': '../shared/src'
		}
	}
};

export default config;
