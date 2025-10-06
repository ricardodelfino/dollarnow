<script lang="ts">
	// The official and permanent URL for the DollarNow extension.
	const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/dollarnow/gfohldokldppbdmcbhmppjiedoobhlfk';
</script>

<main class="alerts-info-page">
	<div class="icon-container">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path
				d="M13.73 21a2 2 0 0 1-3.46 0"
			/>
		</svg>
	</div>
	<h1>Get Real-Time Rate Alerts</h1>
	<p class="description">
		The alerts feature is exclusively available in our free Chrome Extension. Get instant
		notifications right in your browser when your target rates are met.
	</p>
	<a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" class="install-button">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path
				d="M12 18c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6z"
			/><path d="M12 12v.01" />
		</svg>
		<span>Install for Chrome</span>
	</a>
	<p class="subtle-text">It's free, secure, and enhances your currency tracking experience.</p>
</main>

<style>
	.alerts-info-page {
		max-width: 500px;
		margin: 2rem auto;
		padding: 2rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}
	.icon-container {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background-color: var(--color-background-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-rate-value);
	}
	.icon-container svg {
		width: 40px;
		height: 40px;
	}
	h1 {
		font-size: 2rem;
		color: var(--color-text-primary);
		margin: 0;
	}
	.description {
		font-size: 1.1rem;
		color: var(--color-text-secondary);
		max-width: 400px;
	}
	.install-button {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		background-color: var(--color-rate-value);
		color: var(--color-background);
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
		transition: transform 0.2s ease;
	}
	.install-button:hover {
		transform: scale(1.05);
	}
	.subtle-text {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		opacity: 0.8;
	}
</style>