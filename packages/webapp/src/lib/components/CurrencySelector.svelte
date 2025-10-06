<script lang="ts">
	export let label: string;
	export let currencyCode: string;
	export let currencyName: string;
	export let flagUrl: string;
	export let amount: number;
	export let currencies: { code: string; name: string; flag: string }[];
	export let onCurrencyChange: (newCode: string) => void;
</script>

<div class="card">
	<label for={label}>{label}</label>
	<div class="input-group">
		<div class="currency-picker">
			<img src={flagUrl} alt={`${currencyCode} flag`} class="flag" />
			<select
				bind:value={currencyCode}
				on:change={(e) => onCurrencyChange(e.currentTarget.value)}
				aria-label="Select currency"
			>
				{#each currencies as currency}
					<option value={currency.code}>{currency.code}</option>
				{/each}
			</select>
		</div>
		<input type="number" bind:value={amount} id={label} placeholder="0.00" />
	</div>
</div>

<style>
	.card {
		background-color: var(--color-background-secondary);
		border-radius: 8px;
		padding: 1rem;
		border: 1px solid var(--color-border);
	}

	label {
		display: block;
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		margin-bottom: 0.5rem;
	}

	.input-group {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.currency-picker {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-right: 1px solid var(--color-border);
		padding-right: 1rem;
	}

	.flag {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
	}

	select,
	input {
		background: transparent;
		border: none;
		color: var(--color-text-primary);
		font-size: 1.5rem;
		font-weight: 600;
		padding: 0.5rem;
		width: 100%;
	}

	input {
		text-align: right;
	}

	select {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		cursor: pointer;
		font-size: 1.2rem;
		padding-right: 0;
	}
</style>