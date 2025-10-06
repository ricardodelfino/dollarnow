<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import CurrencyRow from '$lib/components/CurrencyRow.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';
	import { preferences } from '$lib/stores/preferences';
	import { FIAT_SYMBOLS, ASSET_SYMBOLS } from 'shared';

	export let data: PageData;

	let fromValue: number | undefined = 1;
	let toValue: number | undefined;
	let lastEdited: 'from' | 'to' = 'from';

	// Flag to prevent hydration mismatch on client.
	let hydrated = false;

	// Reactive variables with fallback for SSR safety
	$: currency = $preferences?.currency || 'BRL';
	$: inverted = $preferences?.inverted || false;

	// Reactive logic to determine source and target currencies
	$: fromCode = inverted ? currency : 'USD';
	$: toCode = inverted ? 'USD' : currency;

	// --- Simplified Rate Logic ---
	// The API now provides a consistent format (units per 1 USD), so the logic is much simpler.
	// The conversion rate from the top row to the bottom row is a simple division.
	$: effectiveRate =
		data.rates && data.rates[fromCode] && data.rates[toCode]
			? data.rates[toCode] / data.rates[fromCode]
			: 0;

	$: {
		if (effectiveRate > 0) {
			if (lastEdited === 'from' && fromValue !== undefined) {
				toValue = fromValue * effectiveRate;
			} else if (lastEdited === 'to' && toValue !== undefined) {
				fromValue = toValue / effectiveRate;
			} else if (fromValue !== undefined) {
				// Fallback to recalculate if no field was recently edited
				toValue = fromValue * effectiveRate;
			}
		}
	}

	$: categorizedItems =
		data.rates && data.metadata
			? [
					{
						name: 'Currencies',
						items: FIAT_SYMBOLS.filter((code) => data.rates[code])
							.map((code) => ({
								code,
								name: data.metadata[code]?.name || code,
								flag: data.metadata[code]?.flag || '/flags/unknown.svg'
							}))
							.sort((a, b) => a.code.localeCompare(b.code))
					},
					{
						name: 'Assets',
						items: ASSET_SYMBOLS.filter((code) => data.rates[code])
							.map((code) => ({
								code,
								name: data.metadata[code]?.name || code,
								flag: data.metadata[code]?.flag || '/flags/unknown.svg'
							}))
							.sort((a, b) => a.code.localeCompare(b.code))
					}
				]
			: [];

	function handleSwap() {
		preferences.update((p) => ({ ...p, inverted: !p.inverted }));
		lastEdited = 'from'; // Recalculate from 'from' after swapping
	}

	function handleFromInput(event: CustomEvent<string>) {
		lastEdited = 'from';
		fromValue = event.detail ? parseFloat(event.detail) : undefined;
	}

	function handleToInput(event: CustomEvent<string>) {
		lastEdited = 'to';
		toValue = event.detail ? parseFloat(event.detail) : undefined;
	}

	function handleCurrencySelect(event: CustomEvent<string>) {
		const newCode = event.detail;
		const isAsset = ASSET_SYMBOLS.includes(newCode);
		// Automatically invert if the selected item is an asset
		preferences.set({ currency: newCode, inverted: isAsset });
	}

	// Auto-refresh data every 90 seconds on the client
	onMount(() => {
		// This ensures we don't show server-rendered state (default 'BRL')
		// before the client can load the user's actual preference from localStorage.
		hydrated = true;

		const interval = setInterval(() => {
			console.log('Refreshing rates...');
			invalidateAll();
		}, 90000); // 90 seconds

		return () => clearInterval(interval); // Cleanup when the component is destroyed
	});
</script>

<main>

	{#if data.error}
		<p class="error">{data.error}</p>
	{:else if data.rates && data.metadata && hydrated}
		<div class="converter-wrapper">
			<CurrencyRow
				amount={fromValue}
				currencyCode={fromCode}
				flagUrl={data.metadata[fromCode]?.flag}
				on:input={handleFromInput}
			/>

			<div class="swap-container">
				<div class="line"></div>
				<button on:click={handleSwap} class="swap-button" aria-label="Swap currencies" title="Swap Currencies">
					<svg aria-hidden="true" focusable="false" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
						<path fill-rule="evenodd" d="M13.707 15.293 16 17.586V3h2v14.586l2.293-2.293 1.414 1.414-3.993 3.993a1.01 1.01 0 0 1-1.428 0l-3.993-3.993zM8 6.414V21H6V6.414L3.707 8.707 2.293 7.293 6.286 3.3a1.01 1.01 0 0 1 1.428 0l3.993 3.993-1.414 1.414z" clip-rule="evenodd"></path>
					</svg>
				</button>
				<div class="line"></div>
			</div>

			<CurrencyRow
				amount={toValue}
				currencyCode={toCode}
				flagUrl={data.metadata[toCode]?.flag}
				on:input={handleToInput}
			/>

			<fieldset class="selector-container">
				<legend>Change currency:</legend>
				<CustomSelect
					categories={categorizedItems}
					selectedCode={currency}
					on:select={handleCurrencySelect}
				/>
			</fieldset>

			<div class="rate-display-box">
				<!-- This box now always reflects the conversion from the top row to the bottom row -->
				<span class="rate-label">1 {data.metadata[fromCode]?.name || fromCode} =</span>
				<span class="rate-value">
					{#if effectiveRate > 0}
						{new Intl.NumberFormat(undefined, {
							style: 'currency',
							currency: toCode,
							maximumFractionDigits: effectiveRate > 999 ? 0 : 3
						}).format(effectiveRate)}
					{/if}
				</span>

				<div class="rate-timestamp">
					<div class="icon-clock">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
							<path
								d="M256 64C150 64 64 150 64 256s86 192 192 192 192-86 192-192S362 64 256 64z"
								stroke-miterlimit="10"
							></path>
							<path stroke-linecap="round" stroke-linejoin="round" d="M256 128v144h96"></path>
						</svg>
					</div>
					<span>
						{#if data.updatedAt}
							{new Date(data.updatedAt).toLocaleString(undefined, {
								day: '2-digit',
								month: '2-digit',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit'
							})}
						{/if}
					</span>
				</div>
			</div>
		</div>
	{:else}
		<p>Loading rates...</p>
	{/if}
</main>

<style>
	main {
		max-width: 600px;
		padding: 0 1rem;
    	margin: 1% auto;
	}
	.swap-button svg {
		width: 24px;
		height: 24px;
		fill: var(--color-rate-value);
	}
	.converter-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.swap-container {
		display: flex;
		align-items: center;
		margin: 0.5rem 0;
	}
	.line {
		flex-grow: 1;
		height: 1px;
		background-color: var(--color-border);
		opacity: .5;
	}
	.swap-button {
		background-color: transparent;
		color: var(--color-primary);
		border: 1px solid var(--color-bottomnav-active-text);
		border-radius: 50%;
		width: 40px;
		height: 40px;
		font-size: 1.5rem;
		cursor: pointer;
		transition:
			transform 0.3s ease,
			background-color 0.2s;
		flex-shrink: 0;
		margin: 0 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
		:global([data-theme='light']) .swap-button {
		background-color: var(--color-bottomnav-active-text);
		border-color: var(--color-bottomnav-active-text);
		color: var(--color-text-primary);
		/*border: 1px solid #9fe870;*/
	}
		:global([data-theme='dark']) .swap-button:hover 
	 {
		background-color: #2E481A;
	}
	.swap-button:hover {
		transform: scale(1.05);
		background-color: #9fe870;
		border-color: #9fe870;
		}

	.selector-container {
		margin-top: 1rem;
		padding: 0;
		background-color: var(--color-background-secondary);
    	border: 1px solid var(--color-border);
    	border-radius: 8px;
	}
	.selector-container legend {
		font-size: 0.95rem;
		color: var(--color-text-secondary);
		margin-left: .8rem;
	}

	.rate-display-box {
		margin-top: 2rem;
		padding: 1.5rem;
		background-color: var(--color-background-secondary);
		border-radius: 8px;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.rate-label {
		font-size: 1rem;
		color: var(--color-text-secondary);
	}
	.rate-value {
		font-size: 3.6rem; /* 100% larger than the 1.8rem h1 */
		font-weight: 700;
		color: var(--color-rate-value);
		line-height: 1.5;
		padding-bottom: 1rem;
		/* Non-standard property for text outline, provides a nice effect on some browsers */
		-webkit-text-stroke: 1.2px
	}
	.rate-timestamp {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
	}
</style>