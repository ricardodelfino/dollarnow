import { ALL_CURRENCIES, currencyMetadata, ASSET_SYMBOLS } from './lib/constants.js';

const addAlertForm = document.getElementById('add-alert-form');
const alertSoundSelect = document.getElementById('alert-sound');
// The actual sound file names. The text for the dropdown will be generated from these.
const soundOptions = [
    { value: 'none' },
    { value: '3-stars.mp3' },
    { value: 'coin.mp3' },
    { value: 'coins-falling.mp3' },
    { value: 'cristal-chime.mp3' },
    { value: 'door-bell.mp3' },
    { value: 'double-cow-bell.mp3' },
    { value: 'marimba-bubble.mp3' },
    { value: 'uncap-bottle.mp3' }
];
const customCurrencySelect = document.getElementById('custom-currency-select');
const selectTrigger = customCurrencySelect.querySelector('.custom-select-trigger');
const selectOptions = customCurrencySelect.querySelector('.custom-select-options');

const alertsList = document.getElementById('alerts-list');
const invertAlertBtn = document.getElementById('invert-alert-btn');
const baseCurrencyLabel = document.getElementById('base-currency-label');
const quoteCurrencyLabel = document.getElementById('quote-currency-label');
const currentRateDisplay = document.getElementById('current-rate-display');

let state = {
    rates: {},
    selectedCurrency: 'BRL',
    theme: 'system', // Default theme
    isAlertInverted: false
};
let userLocale = chrome.i18n.getUILanguage();

function applyTheme(theme) {
    let isDark;
    if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
        isDark = theme === 'dark';
    }
    document.body.classList.toggle('dark-theme', isDark);
}

function formatSoundName(filename) {
    if (filename === 'none') return '🔇 No Sound';
    // 'door-bell.mp3' -> 'Door Bell'
    const name = filename.replace('.mp3', '').replace(/-/g, ' ');
    return '🔊 ' + name.charAt(0).toUpperCase() + name.slice(1);
}

function populateSoundDropdown() {
    alertSoundSelect.innerHTML = '';
    soundOptions.forEach(sound => {
        const option = document.createElement('option');
        option.value = sound.value;
        option.textContent = formatSoundName(sound.value).replace(/🔊 |🔇 /g, ''); // Remove icon for the main form
        alertSoundSelect.appendChild(option);
    });
}

function updateSelectedOption(currencyCode) {
    const meta = currencyMetadata[currencyCode];
    selectTrigger.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
            <img src="${meta.flag}" alt="${meta.name}" class="flag" />
            <span class="option-code">${currencyCode}</span>
            <span class="option-name">${meta.name}</span>
        </div>
        <span style="margin-left: auto;">▼</span>
    `;
    state.selectedCurrency = currencyCode;

    // Auto-invert for assets
    const isAsset = ASSET_SYMBOLS.includes(currencyCode);
    if (state.isAlertInverted !== isAsset) {
        state.isAlertInverted = isAsset;
    }

    updateAlertFormUI();
}

function populateCurrencyDropdown() {
    const currenciesToShow = ALL_CURRENCIES.filter(c => c !== 'USD');
    selectOptions.innerHTML = '';

    currenciesToShow.forEach(code => {
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
        optionEl.addEventListener('click', () => {
            updateSelectedOption(code);
            selectOptions.style.display = 'none';
            selectTrigger.setAttribute('aria-expanded', 'false');
        });
        selectOptions.appendChild(optionEl);
    });

    updateSelectedOption(state.selectedCurrency);
}

function toggleDropdown() {
    const isExpanded = selectTrigger.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
        selectOptions.style.display = 'none';
        selectTrigger.setAttribute('aria-expanded', 'false');
    } else {
        selectOptions.style.display = 'block';
        selectTrigger.setAttribute('aria-expanded', 'true');
        const selected = selectOptions.querySelector(`[data-value="${state.selectedCurrency}"]`);
        if (selected) {
            selected.focus();
        }
    }
}

function updateCurrentRateDisplay() {
    const quoteCurrency = state.selectedCurrency;
    if (!state.rates || !state.rates[quoteCurrency]) {
        currentRateDisplay.textContent = '...';
        return;
    }

    let rate;
    if (state.isAlertInverted) {
        rate = 1 / state.rates[quoteCurrency];
    } else {
        rate = state.rates[quoteCurrency];
    }

    // Format rate: no decimals for values > 999
    if (rate > 999) {
        currentRateDisplay.textContent = Math.floor(rate).toLocaleString(userLocale);
    } else {
        currentRateDisplay.textContent = rate.toFixed(4);
    }
}

function updateAlertFormUI() {
    const currencyPairSelector = document.querySelector('.currency-pair-selector');
    currencyPairSelector.classList.toggle('inverted', state.isAlertInverted);
    updateCurrentRateDisplay();
}

function playTestSound() {
    const selectedSound = alertSoundSelect.value;
    if (selectedSound && selectedSound !== 'none') {
        chrome.runtime.sendMessage({
            action: 'testSound',
            soundFile: selectedSound
        });
    }
}
async function renderAlerts() {
    const { alerts } = await chrome.storage.local.get({ alerts: [] });
    alertsList.innerHTML = '';
    if (alerts.length === 0) {
        alertsList.innerHTML = '<li>No alerts configured.</li>';
        return;
    }

	alerts.forEach((alert) => {
        const li = document.createElement('li');
        li.dataset.id = alert.id;
        li.className = alert.enabled ? 'enabled' : 'disabled';

        const conditionText = alert.condition === 'above' ? '>' : '<';
        const permanentText = alert.isPermanent ? 'Permanent' : 'One-time';
		const lastReachedDate = alert.lastReached
			? `Last triggered: ${new Date(alert.lastReached).toLocaleString(userLocale)}`
			: '';

        const soundOptionsHtml = soundOptions.map(sound =>
            `<option
                value="${sound.value}"
                ${alert.sound === sound.value ? 'selected' : ''}
            >
                ${formatSoundName(sound.value)}
            </option>`
        ).join('');
        li.innerHTML = `
            <div class="alert-main-info">
                <div class="alert-pair">
                    <span class="pair-text">${alert.base} / ${alert.quote}</span>
                </div>
                <div class="actions">
                    <label class="toggle-switch" title="${alert.enabled ? 'Disable' : 'Enable'} alert">
                        <input type="checkbox" data-action="toggle" ${alert.enabled ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <button class="delete-btn" data-action="delete">Delete</button>
                </div>
            </div>
            <div class="alert-controls">
                <div class="control-group">
                    <label>Condition</label>
                    <select class="alert-condition-select" data-action="edit" data-field="condition">
                        <option value="above" ${alert.condition === 'above' ? 'selected' : ''}>Above</option>
                        <option value="below" ${alert.condition === 'below' ? 'selected' : ''}>Below</option>
                    </select>
                    <input type="number" class="alert-value-input" value="${alert.value}" step="0.0001" data-action="edit" data-field="value">
                </div>
                <div class="control-group">
                    <select class="alert-sound-select" data-action="edit" data-field="sound">
                        ${soundOptionsHtml}
                    </select>
                </div>
                <div class="control-group frequency-group">
                    <span class="frequency-toggle" data-action="toggle-frequency" title="Click to change frequency">${permanentText}</span>
                </div>
            </div>
        `;
        alertsList.appendChild(li);
    });
}
addAlertForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newAlert = {
        id: Date.now(),
        base: state.isAlertInverted ? state.selectedCurrency : 'USD',
        quote: state.isAlertInverted ? 'USD' : state.selectedCurrency,
        condition: document.getElementById('alert-condition').value,
        value: parseFloat(document.getElementById('alert-value').value),
        isPermanent: document.getElementById('alert-frequency').value === 'permanent',
		sound: document.getElementById('alert-sound').value,
        enabled: true,
        lastReached: null
    };

    const { alerts } = await chrome.storage.local.get({ alerts: [] });
    alerts.push(newAlert);
    await chrome.storage.local.set({ alerts });
    addAlertForm.reset();
    updateSelectedOption(state.selectedCurrency); // Reset to default selected currency
    renderAlerts();
});

async function handleAlertListInteraction(e) {
    const target = e.target;
    const alertLi = target.closest('li');
    if (!alertLi) return;

    const alertId = parseInt(alertLi.dataset.id);
    const { alerts } = await chrome.storage.local.get({ alerts: [] });
    const alertIndex = alerts.findIndex(a => a.id === alertId);
    if (alertIndex === -1) return;

    const action = target.dataset.action;
    let needsSave = false;

    if (action === 'delete') {
        alerts.splice(alertIndex, 1);
        needsSave = true;
    } else if (action === 'toggle') {
        alerts[alertIndex].enabled = !alerts[alertIndex].enabled;
        needsSave = true;
    } else if (action === 'toggle-frequency') {
        alerts[alertIndex].isPermanent = !alerts[alertIndex].isPermanent;
        needsSave = true;
    } else if (action === 'edit') {
        const field = target.dataset.field;
        const value = target.type === 'number' ? parseFloat(target.value) : target.value;
        if (alerts[alertIndex][field] !== value) {
            alerts[alertIndex][field] = value;
            needsSave = true;
        }
    }

    if (needsSave) {
        await chrome.storage.local.set({ alerts });
        renderAlerts(); // Re-render to reflect changes
    }
}

alertsList.addEventListener('click', handleAlertListInteraction);
alertsList.addEventListener('change', handleAlertListInteraction); // For select and input changes

invertAlertBtn.addEventListener('click', () => {
    state.isAlertInverted = !state.isAlertInverted;
    updateAlertFormUI();
});

document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get(['rates', 'selectedCurrency', 'theme']);
    state = { ...state, ...data };
    
    applyTheme(state.theme);
    populateSoundDropdown();
    populateCurrencyDropdown();
    updateAlertFormUI();
    renderAlerts();

    const testSoundBtn = document.getElementById('test-sound-btn');
    testSoundBtn.addEventListener('click', playTestSound);

    selectTrigger.addEventListener('click', toggleDropdown);
    document.addEventListener('click', (e) => {
        if (!customCurrencySelect.contains(e.target)) {
            selectOptions.style.display = 'none';
            selectTrigger.setAttribute('aria-expanded', 'false');
        }
    });
});
