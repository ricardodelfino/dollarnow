import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// This is crucial for monorepo setups.
	// It tells Vite to bundle the 'shared' package instead of treating it as an external dependency during SSR.
	ssr: {
		noExternal: ['shared']
	}
});