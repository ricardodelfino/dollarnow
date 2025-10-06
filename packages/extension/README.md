# DollarNow Chrome Extension

<p align="center">
  <img src="https://raw.githubusercontent.com/ricardodelfino/dollarnow/main/packages/assets/logo/logo-vector.svg" alt="DollarNow Logo" width="250">
</p>


This is the DollarNow Google Chrome extension, which brings real-time currency exchange rates and conversion tools directly to your browser.

## ✨ Features

*   **Real-Time Badge**: See the live exchange rate of your favorite currency directly on the toolbar icon.
*   **Instant Converter**: A quick-access popup to convert values between USD and over 20 other currencies and assets.
*   **Smart Currency Selection**: Choose from a categorized list of fiat currencies and assets (like Gold, Silver, and Bitcoin).
*   **Custom Rate Alerts**: Get visual and sound notifications when a currency hits your target value.
    *   Set alerts for rates going "above" or "below" a certain point.
    *   Choose between one-time or permanent alerts.
    *   Configure a "cooldown" period for permanent alerts to avoid excessive notifications.
*   **Customizable Display**: For large numbers, you can choose how the rate is formatted on the badge (e.g., `112k`, `112.4k`, or `112`).
*   **Light & Dark Mode**: The interface automatically adapts to your system's theme, or you can toggle it manually.
*   **Seamless Webapp Integration**: The extension intelligently interacts with the DollarNow Webapp, providing a unified experience.

##  Install

You can install the extension directly from the Chrome Web Store:

**[Install DollarNow for Chrome](https://chromewebstore.google.com/detail/dollarnow/gfohldokldppbdmcbhmppjiedoobhlfk)**

## 🛠️ How to Install for Development (Alternative)

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