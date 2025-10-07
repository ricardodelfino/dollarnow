import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	// This is the crucial part for production builds in a monorepo.
	// It tells Vite to bundle the 'shared' package instead of treating it as an external dependency during SSR.
	ssr: {
		noExternal: ['shared']
	}
});