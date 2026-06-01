# ExpenseSnap

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![PWA](https://img.shields.io/badge/PWA-ready-orange.svg)
![No Backend](https://img.shields.io/badge/backend-none-green.svg)

**Snap receipts. Track expenses.** An offline-first PWA with zero backend — your data stays on your device.

## Features

- **Receipt capture** — Snap a photo or upload from gallery
- **Auto-categorization** — Type a description and the category picks itself
- **Dashboard** — Monthly totals, category breakdown chart, recent expenses
- **Full CRUD** — Add, edit, delete expenses with a tap
- **Search & filter** — By date range, category, or amount
- **CSV export** — Download all your data as a spreadsheet
- **Multi-currency** — USD, EUR, GBP, JPY, and more
- **Works offline** — Service worker caches everything
- **Installable** — Add to home screen like a native app
- **Zero backend** — All data in IndexedDB + localStorage on your device

## Quick Start

No build step required for the compiled output. Just serve the `public/` folder:

```bash
# Option 1: Any static server
npx serve public

# Option 2: Python
cd public && python3 -m http.server 8000

# Option 3: Open directly in a browser (limited PWA support)
open public/index.html
```

### Build from source

```bash
npm install
npm run build
```

This compiles TypeScript from `src/` into `public/js/`.

## Screenshots

```
┌─────────────────────────────┐
│  ExpenseSnap                │
├─────────────────────────────┤
│  Dashboard                  │
│                             │
│  ┌─────────────────────────┐│
│  │ This Month     $482.50  ││
│  │ ↑ 12% vs last month     ││
│  └─────────────────────────┘│
│  ┌────────┐  ┌────────┐    │
│  │Last Mo.│  │  Trans. │    │
│  │$430.00 │  │   23    │    │
│  └────────┘  └────────┘    │
│                             │
│  SPENDING BY CATEGORY       │
│  🍔 Food    ████████  42%  │
│  🚗 Trans   █████     28%  │
│  🛍️ Shop    ███       18%  │
│  📄 Bills   ██        12%  │
│                             │
│  RECENT                     │
│  🍔 Dinner at Thai  $24.50 │
│  🚗 Uber to office  $12.30 │
│  🛍️ Amazon order   $89.99 │
│                             │
├─────────────────────────────┤
│  📊      ➕      📋     ⚙️  │
│ Dash    Add   History  Set  │
└─────────────────────────────┘
```

```
┌─────────────────────────────┐
│  New Expense                │
├─────────────────────────────┤
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐│
│  │  📷 Attach a receipt   ││
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘│
│  [📸 Camera] [📁 Upload]   │
│                             │
│  AMOUNT                     │
│  [$] [24.50            ]    │
│                             │
│  DATE         CATEGORY      │
│  [2026-05-31] [🍔 Food  ]  │
│                             │
│  DESCRIPTION                │
│  [Dinner at Thai place ]    │
│                             │
│  NOTES (optional)           │
│  [With friends          ]   │
│                             │
│  [    Save Expense      ]   │
│                             │
├─────────────────────────────┤
│  📊      ➕      📋     ⚙️  │
└─────────────────────────────┘
```

## Data Storage

All data lives on your device. No accounts, no cloud, no tracking.

| Data | Storage | Purpose |
|------|---------|---------|
| Expenses | IndexedDB | All expense records with receipt images |
| Settings | localStorage | Currency preference |

Receipt photos are resized to 800px max and stored as base64 in IndexedDB alongside the expense record.

## Export Format

CSV export produces columns:

```
Date,Amount,Currency,Category,Description,Notes
05/31/2026,24.50,$,Food,Dinner at Thai place,With friends
```

## Tech Stack

- **TypeScript** — compiled to ES2020 modules
- **CSS** — custom properties, no framework
- **IndexedDB** — expense + receipt storage
- **Service Worker** — offline caching
- **PWA Manifest** — installable as native app

No React, no Vue, no webpack, no backend.

## File Structure

```
expense-tracker/
├── src/              # TypeScript source
│   ├── app.ts        # Main app, routing, state
│   ├── storage.ts    # IndexedDB + localStorage
│   ├── camera.ts     # Camera/file capture
│   ├── categorizer.ts # Auto-categorization
│   ├── charts.ts     # CSS bar chart renderer
│   ├── export.ts     # CSV export
│   └── types.ts      # Type definitions
├── public/           # Serve this folder
│   ├── index.html    # Single page app
│   ├── styles.css    # All styles
│   ├── manifest.json # PWA manifest
│   ├── sw.js         # Service worker
│   ├── icons/        # SVG app icons
│   └── js/           # Compiled TS output
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

## Categories

| Icon | Category | Auto-matches keywords like |
|------|----------|---------------------------|
| 🍔 | Food | restaurant, grocery, coffee, dinner, uber eats |
| 🚗 | Transport | gas, uber, lyft, parking, bus, flight |
| 🛍️ | Shopping | amazon, store, clothes, electronics |
| 🎬 | Entertainment | netflix, movie, concert, gaming, spotify |
| 📄 | Bills | rent, electricity, internet, insurance |
| 💊 | Health | doctor, pharmacy, dentist, medical |
| 📚 | Education | tuition, course, textbook, udemy |
| 📌 | Other | anything else |

## Contributing

Issues and pull requests welcome at [github.com/katogatogato/expense-snap](https://github.com/katogatogato/expense-snap).

## License

[MIT](LICENSE) — katogatogato
