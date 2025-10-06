<script lang="ts">
	import { parseLocalizedNumber } from 'shared';
	import { createEventDispatcher } from 'svelte';

	export let amount: number | undefined = undefined;
	export let currencyCode: string;
	export let flagUrl: string;
	export let readonly = false;

	let isFocused = false;
	let localValue: string = '';

	const dispatch = createEventDispatcher();

	// Formatter for number display. Using `useGrouping: true` to match user's locale expectations (e.g., 125.199,99 in Brazil).
	const numberFormatter = new Intl.NumberFormat(undefined, {
		useGrouping: true,
		minimumFractionDigits: 2,
		maximumFractionDigits: 4 // Allow more precision for crypto/assets
	});

	function handleInput(event: Event) {
		const inputElement = event.target as HTMLInputElement;
		localValue = inputElement.value;
		// Use the shared parser to handle different locales
		const parsed = parseLocalizedNumber(localValue, undefined);
		dispatch('input', isNaN(parsed) ? undefined : String(parsed));
	}

	function handleFocus() {
		isFocused = true;
		// When focusing, show the raw number for easy editing
		localValue = amount !== undefined ? String(amount).replace('.', (1.1).toLocaleString().substring(1, 2)) : '';
	}

	function handleBlur() {
		isFocused = false;
		// When blurring, format the number for display
		localValue = formatForDisplay(amount);
	}

	function formatForDisplay(value: number | undefined) {
		if (value === undefined || isNaN(value)) return '';
		return numberFormatter.format(value);
	}

	$: if (!isFocused) localValue = formatForDisplay(amount);
</script>

<div class="row">
	<div class="currency-info">
		<img src={flagUrl} alt={`${currencyCode} flag`} class="flag" />
		<span class="code">{currencyCode}</span>
	</div>
	<input
		type="text"
		inputmode="decimal"
		{readonly}
		value={localValue}
		on:input={handleInput}
		on:focus={handleFocus}
		on:blur={handleBlur}
		placeholder="0.00"
		class:readonly
	/>
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		background-color: var(--color-background-secondary);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 0.75rem 1rem;
		gap: 1rem;
	}

	.currency-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-right: 1rem;
		border-right: 1px solid var(--color-border);
	}

	.flag {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		object-fit: cover;
		background-color: var(--color-background-tertiary);
	}

	.code {
		font-weight: 600;
		font-size: 1.1rem;
		color: var(--color-text-primary);
	}

	input {
		flex-grow: 1;
		background: transparent;
		border: none;
		color: var(--color-text-primary);
		font-size: 1.75rem;
		font-weight: 500;
		text-align: right;
		width: 100%;
		padding: 0;
	}

	input:focus {
		outline: none;
	}

	input.readonly {
		pointer-events: none;
		color: var(--color-text-secondary);
	}

	input::placeholder {
		color: var(--color-text-secondary);
	}
</style>