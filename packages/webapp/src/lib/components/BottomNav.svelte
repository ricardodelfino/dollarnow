<script lang="ts">
	import { onMount } from 'svelte';
	import { preferences } from '$lib/stores/preferences';

	let isExtensionInstalled = false;

	// Reactive variables that update whenever preferences change.
	$: fromCode = $preferences.inverted ? $preferences.currency : 'USD';
	$: toCode = $preferences.inverted ? 'USD' : $preferences.currency;

	// The chart link is now built directly inside the component that uses it.
	$: chartLink = `https://www.xe.com/currencycharts/?from=${fromCode}&to=${toCode}&view=1D`;

	function handleAlertsClick(event: MouseEvent) {
		if (isExtensionInstalled) {
			event.preventDefault(); // Prevent navigation if it's a link
			// Dispatch a custom event that the content script will listen for
			window.dispatchEvent(new CustomEvent('dollarnow:open-options-page'));
		}
		// If the extension is not installed, the default link behavior to '/alerts' will proceed.
	}

	onMount(() => {
		// Listen for the 'hello' message from the extension's content script
		window.addEventListener('dollarnow:extension-installed', () => {
			console.log('DollarNow extension detected!');
			isExtensionInstalled = true;
		});

		// Announce that the page is ready to be checked by the extension
		window.dispatchEvent(new CustomEvent('dollarnow:page-ready'));
	});
</script>

<nav class="bottom-nav">
	<a href="/" class="nav-item active" aria-current="page">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<polyline points="17 1 21 5 17 9" />
			<path d="M3 11V9a4 4 0 0 1 4-4h14" />
			<polyline points="7 23 3 19 7 15" />
			<path d="M21 13v2a4 4 0 0 1-4 4H3" />
		</svg>
		<span>Converter</span>
	</a>

	<a href="/alerts" class="nav-item" on:click={handleAlertsClick}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path
				d="M13.73 21a2 2 0 0 1-3.46 0"
			/>
		</svg>
		<span>Alerts</span>
	</a>

	<a href={chartLink} target="_blank" rel="noopener noreferrer" class="nav-item">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line
				x1="6"
				y1="20"
				x2="6"
				y2="16"
			/>
		</svg>
		<span>Chart</span>
	</a>
</nav>