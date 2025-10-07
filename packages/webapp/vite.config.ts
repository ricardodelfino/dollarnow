import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// This configuration is essential for a monorepo setup.
	ssr: {
		// Tells Vite's SSR build to bundle the 'shared' package instead of treating it as external.
		noExternal: ['shared']
	},
	optimizeDeps: {
		// Forces Vite's pre-bundler to include the 'shared' package for client-side code.
		include: ['shared']
	}
});