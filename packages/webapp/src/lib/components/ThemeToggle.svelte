<script lang="ts">
	import theme from '$lib/stores/theme';
	import { onMount } from 'svelte';

	let isChecked: boolean; // Represents the toggle's checked state (true for dark mode)

	// When the component mounts, sync the toggle state with the theme store.
	onMount(() => {
		const unsubscribe = theme.subscribe((value) => {
			isChecked = value === 'dark';
		});
		return unsubscribe; // Clean up subscription on component destroy
	});

	function toggleTheme() {
		// The `change` event fires, but `bind:checked` updates `isChecked` *after* this function runs.
		// So we must set the theme based on the *opposite* of the current `isChecked` value.
		theme.set(!isChecked ? 'dark' : 'light');
	}
</script>

<label class="theme-toggle-switch" aria-label="Alternar tema de cores">
	<input type="checkbox" on:change={toggleTheme} bind:checked={isChecked} />
	<span class="slider">
		<span class="knob">
			{#if isChecked} <!-- Moon icon for dark mode -->
				<!-- Ícone de Lua (Dark Mode) -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg
				>
			{:else} <!-- Sun icon for light mode -->
				<!-- Ícone de Sol -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line
						x1="12"
						y1="21"
						x2="12"
						y2="23"
					/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line
						x1="18.36"
						y1="18.36"
						x2="19.78"
						y2="19.78"
					/><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line
						x1="4.22"
						y1="19.78"
						x2="5.64"
						y2="18.36"
					/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
			{/if}
		</span>
	</span>
</label>

<style>
	/* Estilos para o switch são definidos em app.css */
</style>