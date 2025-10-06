import { currencyMetadata } from './lib/constants.js';

function applyTheme(theme) {
    let isDark;
    if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
        isDark = theme === 'dark';
    }
    document.body.classList.toggle('dark-theme', isDark);
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const base = params.get('base');
    const quote = params.get('quote');
    const condition = params.get('condition');
    const targetValue = params.get('targetValue');
    const currentRate = params.get('currentRate');

    // Populate the UI with the alert data
    if (base && quote && condition && targetValue && currentRate) {
        const baseMeta = currencyMetadata[base] || {};
        const quoteMeta = currencyMetadata[quote] || {};

        document.getElementById('base-flag').src = baseMeta.flag || 'flags/generic.svg';
        document.getElementById('quote-flag').src = quoteMeta.flag || 'flags/generic.svg';
        document.getElementById('pair-text').textContent = `${base} / ${quote}`;

        const conditionInfo = document.querySelector('.condition-info');
        const conditionIcon = document.getElementById('condition-icon');
        const conditionText = document.getElementById('condition-text');

        if (condition === 'above') {
            conditionInfo.classList.add('above');
            conditionIcon.textContent = '▲';
            conditionText.textContent = `Rate went above ${targetValue}`;
        } else {
            conditionInfo.classList.add('below');
            conditionIcon.textContent = '▼';
            conditionText.textContent = `Rate went below ${targetValue}`;
        }

        document.getElementById('current-rate').textContent = currentRate;
        document.getElementById('target-rate').textContent = parseFloat(targetValue).toFixed(4);
    }

    document.getElementById('close-btn').addEventListener('click', () => window.close());
    document.getElementById('manage-btn').addEventListener('click', () => chrome.runtime.openOptionsPage());

    const { theme = 'system' } = await chrome.storage.local.get('theme');
    applyTheme(theme);

    // Listen for system theme changes if that's the chosen option
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (theme === 'system') {
            applyTheme('system');
        }
    });
});