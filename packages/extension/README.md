# DollarNow Chrome Extension

<p align="center">
  <img src="https://raw.githubusercontent.com/ricardodelfino/dollarnow/main/packages/assets/logo/logo-vector.svg" alt="DollarNow Logo" width="250">
</p>


This is the DollarNow Google Chrome extension, which brings currency exchange rate functionality directly to your browser toolbar.

## ✨ Features

*   **Badge Rate Display**: See the real-time rate of your selected currency directly on the extension icon.
*   **Quick Converter**: Open the popup to perform quick conversions between the US Dollar (USD) and your currency of choice.
*   **Currency Selection**: Easily choose which currency to track. Your preference is saved and synced.
*   **Inverted View**: Quickly toggle between `USD -> CURRENCY` and `CURRENCY -> USD`.
*   **Rate Alerts**: Set up alerts to be notified when a currency reaches a specific value (above or below).
    *   Customizable visual and sound notifications.
    *   Option for permanent or one-time alerts.
*   **Badge Formatting**: For currencies with high values (over 1000), you can customize how the number is displayed on the badge (e.g., `112k`, `112.4k`, `112`).
*   **Light & Dark Theme**: The interface adapts to your system theme, or you can choose one manually.

## 🛠️ How to Install for Development

Since the extension is not on the Chrome Web Store, you can load it locally to test or use it.

### 1. Build the Extension

Because this extension uses code and assets from the `shared` and `assets` packages, you must first run a build script. This script prepares a `dist` folder with all the necessary files in a format the browser can understand.

From the **root of the monorepo**, run:
```bash
npm run build:extension
```
This will create a `dist` folder inside `packages/extension`. This `dist` folder is what you will load into Chrome.

### 2. Load the Extension in Chrome

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone https://github.com/ricardodelfino/dollarnow.git
    cd dollarnow
    ```

2.  **Open Google Chrome** and navigate to `chrome://extensions`.

3.  **Enable "Developer mode"** in the top right corner.

4.  Click on **"Load unpacked"**.

5.  In the file dialog, select the **`packages/extension/dist`** folder.

6.  Done! The DollarNow extension will appear in your list and be active in your browser.