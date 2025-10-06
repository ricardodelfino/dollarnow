# DollarNow Monorepo

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Svelte" src="https://img.shields.io/badge/Svelte-FF3E00?style=for-the-badge&logo=svelte&logoColor=white" />
  <img alt="Cloudflare" src="https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" />
</p>

This is the main repository for the **DollarNow** ecosystem, a suite of tools for real-time currency exchange rates. It is organized as a monorepo to facilitate code sharing and maintenance.

---

## 📂 Package Structure

The monorepo is managed with `npm workspaces` and contains the following packages:

### `/packages/webapp`

The main web application, built with SvelteKit and hosted on Cloudflare Pages. It offers a complete interface for currency conversion.

*   **Access**: dollarnow.app
*   **Read more**: `packages/webapp/README.md`

### `/packages/api`

A robust serverless API built with Cloudflare Workers. It fetches rates from multiple sources (Wise as primary, AwesomeAPI as a fallback) and serves them in a standardized format.

*   **Read more**: `packages/api/README.md`

### `/packages/extension`

A Google Chrome extension that allows users to view rates and perform conversions directly from the browser toolbar.

*   **Read more**: `packages/extension/README.md`

### `/packages/shared`

An internal package containing code shared across other packages, such as TypeScript types, constants (currency lists, metadata), and utility functions. This ensures consistency and avoids code duplication.

### `/packages/assets`

A simple package that centralizes static assets, like SVG flag icons, used by both the `webapp` and the `extension`.

## 🚀 Getting Started

1.  **Clone o repositório:**
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ricardodelfino/dollarnow.git
    cd dollarnow
    ```

2.  **Install dependencies:**
    From the project root, `npm` will install dependencies for all workspace packages.
    ```bash
    npm install
    ```

3.  **Run the projects:**
    You can run the scripts defined in the root `package.json` to start individual projects.
    ```bash
    # To run the web application
    npm run webapp

    # To run the API locally (requires Wrangler CLI)
    npm run api

    # To build the extension for development
    npm run build:extension
    ```