import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

const getInitialTheme = (): Theme => {
	if (!browser) return 'system'; // Default on the server
	return (localStorage.getItem('theme') as Theme) || 'system';
};

const theme = writable<Theme>(getInitialTheme());

theme.subscribe((value) => {
	if (browser) {
		localStorage.setItem('theme', value);

		if (value === 'system') {
			const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			document.documentElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
		} else {
			document.documentElement.setAttribute('data-theme', value);
		}
	}
});

export default theme;

// Ouve mudanças no sistema operacional
if (browser) {
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
		if (getInitialTheme() === 'system') {
			document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
		}
	});
}