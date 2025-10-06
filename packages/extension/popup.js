import { ALL_CURRENCIES, currencyMetadata, ASSET_SYMBOLS, FIAT_SYMBOLS } from './lib/constants.js';

const themeCheckbox = document.getElementById('theme-checkbox');
const customCurrencySelect = document.getElementById('custom-currency-select');
const selectTrigger = customCurrencySelect.querySelector('.custom-select-trigger');
const selectOptions = customCurrencySelect.querySelector('.custom-select-options');

const inputOne = document.getElementById('input-one');
const inputTwo = document.getElementById('input-two');
const labelOne = document.getElementById('label-one');
const labelTwo = document.getElementById('label-two');
const invertButton = document.getElementById('invert-button');
const chartLink = document.getElementById('chart-link');
const alertsLink = document.getElementById('alerts-link');
const formatLink = document.getElementById('format-link');
const lastUpdateEl = document.getElementById('last-update');
const statusIndicatorEl = document.getElementById('status-indicator');


let state = { rates: {}, selectedCurrency: 'BRL', inverted: false, theme: 'system', updatedAt: null };
let userLocale = chrome.i18n.getUILanguage();

const numberFormatter = new Intl.NumberFormat(userLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
});

function applyTheme(theme) {
    let isDark;
    if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
        isDark = theme === 'dark';
    }
    document.body.classList.toggle('dark-theme', isDark);
    themeCheckbox.checked = isDark;
}

function updateSelectedOption(currencyCode) {
    const meta = currencyMetadata[currencyCode];
    selectTrigger.innerHTML = `
        <img src="${meta.flag}" alt="${meta.name}" class="flag" />
        <span class="option-code">${currencyCode}</span>
        <span class="option-name">${meta.name}</span>
        <span style="margin-left: auto;">▼</span>
    `;
    state.selectedCurrency = currencyCode;

    // Mark the new option as selected
    document.querySelectorAll('.custom-select-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.value === currencyCode);
    });
}

function populateCurrencyDropdown() {
    const categories = [
        { name: 'Currencies', symbols: FIAT_SYMBOLS },
        { name: 'Assets', symbols: ASSET_SYMBOLS }
    ];

    selectOptions.innerHTML = '';

    categories.forEach(category => {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'custom-select-category';
        categoryEl.textContent = category.name;
        selectOptions.appendChild(categoryEl);

        category.symbols
            .filter(code => code !== 'USD')
            .sort()
            .forEach(code => {
                const meta = currencyMetadata[code];
                const optionEl = document.createElement('div');
                optionEl.className = 'custom-select-option';
                optionEl.dataset.value = code;
                optionEl.setAttribute('role', 'option');
                optionEl.innerHTML = `
                    <img src="${meta.flag}" alt="${meta.name}" class="flag" />
                    <span class="option-code">${code}</span>
                    <span class="option-name">${meta.name}</span>
                `;
                optionEl.addEventListener('click', () => handleCurrencyChange(code));
                selectOptions.appendChild(optionEl);
            });
    });

    updateSelectedOption(state.selectedCurrency);
}

function toggleDropdown() {
    const isExpanded = selectTrigger.getAttribute('aria-expanded') === 'true';
    customCurrencySelect.classList.toggle('expanded', !isExpanded);
    selectOptions.style.display = isExpanded ? 'none' : 'block';
    selectTrigger.setAttribute('aria-expanded', String(!isExpanded));

}

function updateConverterUI() {
    const selectedCurrencyCode = state.selectedCurrency;
    const usdMeta = currencyMetadata['USD'];
    const selectedMeta = currencyMetadata[selectedCurrencyCode];

    const usdLabelContent = `<img src="${usdMeta.flag}" alt="${usdMeta.name}" class="flag" /> USD`;
    const selectedLabelContent = `<img src="${selectedMeta.flag}" alt="${selectedMeta.name}" class="flag" /> ${selectedCurrencyCode}`;

    if (state.inverted) {
        labelOne.innerHTML = selectedLabelContent;
        labelTwo.innerHTML = usdLabelContent;
    } else {
        labelOne.innerHTML = usdLabelContent;
        labelTwo.innerHTML = selectedLabelContent;
    }

    updateChartLink();
    updateFooter();
    displayInitialConversion();
}

function displayInitialConversion() {
    const rate = state.rates[state.selectedCurrency];
    if (!rate) {
        inputOne.value = '';
        inputTwo.value = '';
        return;
    };

    const baseValue = 1;
    const targetValue = state.inverted ? (1 / rate) : (1 * rate);
    
    inputOne.value = numberFormatter.format(state.inverted ? targetValue : baseValue);
    inputTwo.value = numberFormatter.format(state.inverted ? baseValue : targetValue);
}

function updateFooter() {
    if (state.updatedAt) {
        const date = new Date(state.updatedAt * 1000); // Convert unix seconds to ms
        lastUpdateEl.textContent = `Updated: ${date.toLocaleTimeString(userLocale)}`;
        statusIndicatorEl.style.background = 'var(--primary-color)';
    }
}

function updateChartLink() {
    const from = state.inverted ? state.selectedCurrency : 'USD';
    const to = state.inverted ? 'USD' : state.selectedCurrency;
    chartLink.href = `https://www.xe.com/currencycharts/?from=${from}&to=${to}&view=1D`;
}

function parseLocalizedNumber(str) {
    const thousandSeparator = (1111).toLocaleString(userLocale).substring(1, 2);
    const decimalSeparator = (1.1).toLocaleString(userLocale).substring(1, 2);
    return parseFloat(
        String(str).replace(new RegExp(`\\${thousandSeparator}`, 'g'), '')
                   .replace(new RegExp(`\\${decimalSeparator}`), '.')
    );
}

function handleInput(event) {
    const sourceInput = event.target;
    const targetInput = sourceInput === inputOne ? inputTwo : inputOne;

    if (sourceInput.value.trim() === '') {
        targetInput.value = '';
        return;
    }

    const sourceValue = parseLocalizedNumber(sourceInput.value);
    if (isNaN(sourceValue)) {
        return;
    }

    const rate = state.rates[state.selectedCurrency];
    if (!rate) return;

    let targetValue;
    const isBaseSource = (sourceInput === inputOne && !state.inverted) || (sourceInput === inputTwo && state.inverted);
    
    if (isBaseSource) {
        targetValue = sourceValue * rate;
    } else {
        targetValue = sourceValue / rate;
    }
    targetInput.value = numberFormatter.format(targetValue);
}

async function handleCurrencyChange(newCurrency) {
    const isAsset = ASSET_SYMBOLS.includes(newCurrency);
    state.selectedCurrency = newCurrency;
    state.inverted = isAsset; // Automatically invert for assets
    
    await chrome.storage.local.set({ selectedCurrency: newCurrency, inverted: isAsset });
    chrome.runtime.sendMessage({ action: 'updateBadge' });

    updateConverterUI();
    updateSelectedOption(newCurrency);
    toggleDropdown(); // Close dropdown after selection
}

async function handleInvert() {
    state.inverted = !state.inverted;
    await chrome.storage.local.set({ inverted: state.inverted });
    chrome.runtime.sendMessage({ action: 'updateBadge' });
    updateConverterUI();
}

async function handleThemeToggle(event) {
    state.theme = event.target.checked ? 'dark' : 'light';
    
    applyTheme(state.theme);
    await chrome.storage.local.set({ theme: state.theme });
}

document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get(['rates', 'selectedCurrency', 'inverted', 'theme', 'updatedAt']);
    state = { ...state, ...data };

    applyTheme(state.theme);
    populateCurrencyDropdown();
    updateConverterUI(); // Revert to the simpler call

    inputOne.addEventListener('input', handleInput);
    inputTwo.addEventListener('input', handleInput);
    invertButton.addEventListener('click', handleInvert);
    themeCheckbox.addEventListener('change', handleThemeToggle);
    alertsLink.addEventListener('click', () => chrome.runtime.openOptionsPage());
    formatLink.addEventListener('click', () => window.open(chrome.runtime.getURL('format.html')));

    selectTrigger.addEventListener('click', toggleDropdown);
    document.addEventListener('click', (e) => {
        if (!customCurrencySelect.contains(e.target)) {
            selectOptions.style.display = 'none';
            customCurrencySelect.classList.remove('expanded');
            selectTrigger.setAttribute('aria-expanded', 'false');
        }
    });
});
