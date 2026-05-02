# Financial Data Explorer

Pulls annual revenue data for any US-listed company straight from SEC EDGAR.
Search by ticker,name get a chart. No data vendor, no API key required.

Live-demo: https://us-financial-data-explorer.netlify.app/
## Setup

Requires Node.js 18+

```bash
git clone https://github.com/aman32181/financial-data-explorer.git
cd financial-data-explorer
npm install
cp .env.local.example .env.local
npm run dev
```

Add your details to `.env.local`:

```env
SEC_USER_AGENT="FinancialExplorer your@email.com"
```

EDGAR requires this header per their [fair-access policy](https://www.sec.gov/developer).
It's set server-side only — never touches the client.

---

## Stack

- **Next.js** — proxies EDGAR requests server-side to get around CORS
- **Recharts** — straightforward time-series charts without pulling in D3
- **TypeScript** — EDGAR's response schema is deeply nested; types saved me more than once
- **Tailwind** — no separate stylesheet to maintain
- **React Context** — one shared state object, Redux would've been overkill

---

## Project Structure
src/
├── app/
│   ├── api/sec/route.ts     
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── CompanyHeader.tsx
│   ├── MetricCard.tsx
│   ├── RevenueChart.tsx
│   └── SearchBar.tsx
├── context/
│   └── CompanyContext.tsx
└── types/
└── sec.ts

---

## Limitations worth knowing

- **Annual data only** — filters for 10-K filings, so the latest point can be ~1-10 year old
- **Revenue concept mismatch** — some filers use non-standard GAAP concept names and may return no data
- **Rate limits** — EDGAR will 429 you on bursts; waiting ~30s usually fixes it

---

## What's missing

- More metrics beyond revenue (EPS, operating income)
- Redis caching to avoid re-hitting EDGAR on every dev reload