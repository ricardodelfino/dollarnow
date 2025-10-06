import { currencyMetadata } from './lib/constants.js';

const currencyNameEl = document.getElementById('currency-name');
const badgePreviewEl = document.getElementById('badge-preview');
const saveStatusEl = document.getElementById('save-status');
const optionsList = document.querySelector('.options-list');

let state = {
    rates: {},
    selectedCurrency: 'BRL',
    badgeFormats: {},
    theme: 'system'
};

function applyTheme(theme) {
    let isDark = (theme === 'system') ? window.matchMedia('(prefers-color-scheme: dark)').matches : (theme === 'dark');
    document.body.classList.toggle('dark-theme', isDark);
}

function formatValue(value, format) {
    if (value < 1000) return value.toFixed(2);

    switch (format) {
        case 'full':
            return String(Math.floor(value));
        case 'full_thousands':
            return String(Math.floor(value / 1000));
        case 'compact_k_float':
            return (value / 1000).toFixed(1) + 'k';
        case 'compact_k_int':
        default:
            return Math.round(value / 1000) + 'k';
    }
}

function renderExamples() {
    const rate = state.rates[state.selectedCurrency];
    if (!rate) return;

    document.querySelectorAll('.example').forEach(el => {
        const format = el.dataset.format;
        el.textContent = formatValue(rate, format);
    });
}

function updatePreview(format) {
    const rate = state.rates[state.selectedCurrency];
    if (!rate) return;
    badgePreviewEl.textContent = formatValue(rate, format);
}

async function handleFormatChange(event) {
    const selectedFormat = event.target.value;
    state.badgeFormats[state.selectedCurrency] = selectedFormat;
    
    await chrome.storage.local.set({ badgeFormats: state.badgeFormats });
    
    // Send a message to the background script to update the badge
    chrome.runtime.sendMessage({ action: 'updateBadge' });
    
    updatePreview(selectedFormat);

    saveStatusEl.textContent = 'Saved!';
    setTimeout(() => { saveStatusEl.textContent = ''; }, 2000);
}

document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get(['rates', 'selectedCurrency', 'badgeFormats', 'theme']);
    state = { ...state, ...data };

    applyTheme(state.theme);

    currencyNameEl.textContent = currencyMetadata[state.selectedCurrency]?.name || state.selectedCurrency;
    
    const defaultFormat = 'compact_k_int';
    const currentFormat = state.badgeFormats[state.selectedCurrency] || defaultFormat;
    const radioToCheck = document.querySelector(`input[name="format"][value="${currentFormat}"]`);
    if (radioToCheck) {
        radioToCheck.checked = true;
    }

    renderExamples();
    updatePreview(currentFormat);

    optionsList.addEventListener('change', handleFormatChange);
});
