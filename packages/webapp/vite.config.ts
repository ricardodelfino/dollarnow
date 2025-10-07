import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	// This ensures that Vite properly handles the 'shared' package from the monorepo.
	optimizeDeps: {
		include: ['shared']
	},
	build: {
		commonjsOptions: {
			include: [/shared/, /node_modules/]
		}
	}
});