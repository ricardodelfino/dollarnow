import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			// Allow serving files from one level up to the project root, which is necessary for a monorepo.
			allow: [path.resolve(__dirname, '..')]
		}
	}
});