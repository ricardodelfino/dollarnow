<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';
	import logoUrl from '$lib/assets/logo/logo-vector.svg';
</script>


<header>
	<div class="placeholder"></div>
	<div class="logo-container">
		<a href="/" aria-label="Go to homepage">
			<img src={logoUrl} alt="DollarNow Logo" class="logo-img" />
		</a>
	</div>
	<div class="actions">
		<ThemeToggle />
	</div>
</header>



<style>
	header {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		padding: 1rem;
		gap: 1rem;
	}
	.logo-container {
		grid-column: 2 / 3;
		justify-self: center;
	}
	.logo-img {
		height: 34px;
		width: auto;
		display: block; /* Removes bottom space from img */
		filter: var(--logo-filter, none); /* Use CSS variable for filter */
	}
	.actions {		
		grid-column: 3 / 4;
		justify-self: end;
	}
</style>