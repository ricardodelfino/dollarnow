console.log('DollarNow content script loaded.');

/**
 * Listens for a signal from the webapp page indicating it's ready.
 * When received, it dispatches an event to announce the extension is installed.
 */
window.addEventListener('dollarnow:page-ready', () => {
	console.log('Content script received page-ready, announcing extension presence.');
	window.dispatchEvent(new CustomEvent('dollarnow:extension-installed'));
});

/**
 * Listens for a request from the webapp to open the options page.
 */
window.addEventListener('dollarnow:open-options-page', () => {
	console.log('Content script received request to open options page.');
	chrome.runtime.sendMessage({ action: 'openOptionsPage' });
});