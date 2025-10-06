<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	type Item = { code: string; name: string; flag: string };
	export let categories: { name: string; items: Item[] }[] = [];
	export let selectedCode: string;

	let isOpen = false;
	let selectElement: HTMLElement;

	const dispatch = createEventDispatcher();

	// Acha o item selecionado dentro de todas as categorias
	// Safeguard against categories being undefined during SSR
	$: selectedItem = (categories || [])
		.flatMap((category) => category.items || [])
		.find((item) => item.code === selectedCode);

	function toggle() {
		isOpen = !isOpen;
	}

	function select(code: string) {
		dispatch('select', code);
		isOpen = false;
	}

	onMount(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (selectElement && !selectElement.contains(event.target as Node)) {
				isOpen = false;
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	});
</script>

<div class="custom-select" bind:this={selectElement}>
	<button class="select-button" on:click={toggle} aria-haspopup="listbox" aria-expanded={isOpen}>
		{#if selectedItem}
			<img src={selectedItem.flag} alt={selectedItem.name} class="flag" />
			<span class="code">{selectedItem.code}</span>
			<span class="name">{selectedItem.name}</span>
		{/if}
		<span class="chevron">▼</span>
	</button>

	{#if isOpen}
		<ul class="options-list" role="listbox">
			{#each categories as category}
				{#if category.items.length > 0}
					<li class="category-header" role="presentation">{category.name}</li>
					{#each category.items as item}
						<li
							class="option-item"
							role="option"
							aria-selected={item.code === selectedCode}
							on:click={() => select(item.code)}
							on:keydown={(e) => e.key === 'Enter' && select(item.code)}
							tabindex="0"
						>
							<div class="item-details">
								<img src={item.flag} alt={item.name} class="flag" />
								<span class="code">{item.code}</span>
								<span class="name">{item.name}</span>
							</div>
							{#if selectedCode === item.code}
								<div class="check-icon">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
										<path
											fill-rule="evenodd"
											d="M16.704 4.153a.75.75 0 01.142 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.142z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
							{/if}
						</li>
					{/each}
				{/if}
			{/each}
		</ul>
	{/if}
</div>

<style>
	.custom-select {
		position: relative;
		width: 100%;
	}
	.select-button {
		width: 100%;
		padding: 1.1rem 0.8rem;
		background-color: var(--color-background-secondary);
		color: var(--color-text-primary);
		border: 0;
		border-radius: 8px;
		font-size: 1rem;
		display: flex;
		align-items: center;
		text-align: left;
		cursor: pointer;
		gap: 0.75rem;
	}
	.flag {
		width: 24px;
		height: 24px;
		border-radius: 50%;
	}
	.code {
		font-weight: 600;
	}
	.name {
		color: var(--color-text-secondary);
		flex-grow: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.chevron {
		font-size: 0.6rem;
		color: var(--color-text-secondary);
	}
	.options-list {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background-color: var(--color-background-secondary);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		margin-top: 4px;
		padding: 0;
		list-style: none;
		max-height: 500px;
		overflow-y: auto;
		z-index: 10;
	}
	.option-item {
		padding: 0.8rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.item-details {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.option-item:hover {
		background-color: var(--color-select-hover-bg);
	}

	.option-item:hover .name {
		color: var(--color-select-hover-text-name);
	}

	.option-item:hover .code {
		color: var(--color-select-hover-text-code);
	}

	.option-item[aria-selected='true'] {
		background-color: var(--color-select-selected-bg);
	}

	.option-item[aria-selected='true'] .name,
	.option-item[aria-selected='true'] .code,
	.option-item[aria-selected='true'] .check-icon {
		color: var(--color-select-selected-text);
	}

	.check-icon {
		width: 20px;
		height: 20px;
	}

	.category-header {
		padding: 0.5rem 0.8rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		background-color: var(--color-background-tertiary);
		text-transform: uppercase;
		position: sticky;
		top: 0;
	}
</style>