# DollarNow API

This is the serverless API that powers the DollarNow ecosystem. It is built as a Cloudflare Worker for high performance and global scalability.

## ✨ Features

*   **Resilient Data Sources**:
    1.  **Wise API (Primary)**: Uses the Wise API to get real-time FIAT currency rates, which are more accurate for actual conversions.
    2.  **AwesomeAPI (Fallback & Assets)**: Used as a secondary source for FIAT currencies if Wise fails, and as the primary source for assets (Gold, Silver, Bitcoin, etc.).
*   **Standardization**: All rates are standardized against the US Dollar (USD). The value returned for each currency represents "how many units of that currency can be bought with 1 USD".
*   **Smart Caching**: Leverages Cloudflare's cache to reduce latency and the number of calls to external APIs, serving fast and efficient responses.
*   **Monorepo Structure**: Imports types and constants (like currency lists) directly from the `shared` package, ensuring consistency with the frontend.

## ⚙️ Endpoint

*   **URL**: `https://dollarnow.21m.workers.dev/`
*   **Method**: `GET`

### Example Success Response

```json
{
  "success": true,
  "rates": {
    "USD": 1,
    "BRL": 5.4321,
    "EUR": 0.9215,
    "BTC": 0.00001485,
    "XAU": 0.000428
  },
  "updated_at": 1678886400
}
```

## 🚀 Deploy

O deploy é feito automaticamente via GitHub Actions sempre que há uma alteração na pasta `/packages/api`. O processo utiliza o Wrangler CLI para publicar o Worker.