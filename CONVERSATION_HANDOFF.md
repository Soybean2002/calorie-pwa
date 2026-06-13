# Conversation Handoff

Last updated: 2026-06-13, Asia/Shanghai

Read this before making future changes.

## Project

- Current name: 小鲨记账
- Local path: `/Users/soybean/编程/calorie-pwa`
- GitHub repo: `https://github.com/Soybean2002/calorie-pwa`
- GitHub Pages app: `https://soybean2002.github.io/calorie-pwa/`
- Main branch: `main`
- The app is now a static, dependency-free personal ledger PWA inspired by the clean mobile UI rhythm of 鲨鱼记账, without ads or backend requirements.

## Current State

The app was reworked from the previous calorie tracker into a local-first accounting app.

Main features:

- Yellow month summary header with income and expense totals
- Shortcut panel for bills, budget, assets, discovery, and more
- Bottom navigation with a central add-entry button
- Expense/income entry form with categories, account, date, and note
- Ledger entries grouped by date
- Monthly budget progress
- Simple asset manager for cash, savings, and debt
- Monthly charts: recent daily bars and category ranking
- JSON backup import/export
- PWA manifest and service worker cache updated for 小鲨记账

## Important Files

- `index.html`: app shell and templates
- `styles.css`: Shark-style mobile UI
- `app.js`: ledger state, rendering, storage, statistics, backup/import logic
- `sw.js`: service worker cache version
- `manifest.webmanifest`: PWA name/theme/icons
- `README.md`: current project documentation
- `deepseek-proxy/`: legacy calorie-tracker Worker template, not used by the ledger app

## Data Model

Local storage key:

```text
ledger-pwa-state-v1
```

State shape:

```js
{
  settings: {
    monthlyBudget: "",
    assets: {
      cash: "",
      saving: "",
      debt: ""
    }
  },
  entriesByDate: {
    "YYYY-MM-DD": [
      {
        id,
        type: "expense" | "income",
        category,
        amount,
        account,
        note,
        createdAt
      }
    ]
  }
}
```

## Development Commands

Run locally:

```bash
cd /Users/soybean/编程/calorie-pwa
python3 -m http.server 4173
```

Syntax check:

```bash
node --check app.js
```

## Verification Notes

Most recent verification:

- `node --check app.js`
- Local server at `http://localhost:4173`
- Browser-tested at 390px width
- Added a sample expense and confirmed month summary, daily ledger, and charts update
- Confirmed no horizontal overflow at 390px

## Suggested Future Work

- Custom categories
- CSV export
- Month previous/next controls instead of prompt-based month switching
- Search/filter entries
- Account-level statistics
- Replace legacy calorie icons with ledger-specific app icons
