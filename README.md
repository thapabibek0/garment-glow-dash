# Yangse — Clothing Business Accounting

Yangse is a lightweight accounting and inventory app built for clothing shops. It runs on TanStack Start, Tailwind CSS, and Lovable Cloud (Supabase) with per-user data isolation enforced through Row-Level Security.

## How the accounting works

Yangse uses a **derived double-entry** model: instead of asking the user to write journal entries by hand, it stores only the three things a shop owner naturally records — **Income** (sales/revenue), **Expenses** (rent, salaries, materials, etc.), and **Inventory movements** (stock added or sold) — and then mechanically generates every accounting artifact from that raw data on the fly. Each income event posts a debit to **Cash** and a credit to **Income**; each expense posts a debit to **Expenses** and a credit to **Cash**; each inventory purchase (cost price × quantity) posts a debit to **Inventory** and a credit to **Cash**. From this auto-generated journal, the engine (`src/lib/accounting.ts` + `src/lib/use-accounting-data.ts`) aggregates account totals into the **General Ledger**, validates that total debits equal total credits in the **Trial Balance**, computes **Net Profit** (Income − Expenses) for the **Profit & Loss** report, computes **Net Cash Flow** (Cash In − Cash Out, where Cash Out = Expenses + Inventory Purchases) for the **Cash Flow** report, and snapshots **Total Assets = Cash + Inventory**, **Liabilities = 0**, and **Owner's Equity = Assets − Liabilities** for the **Balance Sheet** — so the books always balance, stay consistent with the underlying transactions, and never require manual reconciliation.

## Modules

- **Inventory** — products with category/size/color, cost & selling price, stock tracking, low-stock alerts, and an immutable `inventory_logs` audit trail.
- **Income** — record sales and other revenue sources.
- **Expenses** — log categorised business costs with monthly summaries.
- **General Ledger / Journal / Trial Balance** — auto-generated double-entry views.
- **Profit & Loss** — revenue, expenses, margin %, and category breakdown.
- **Balance Sheet** — assets, liabilities, equity, and the accounting equation check.
- **Cash Flow** — money in vs. money out, including inventory purchases.
- **Reports** — combined P&L + cash flow + ledger summary, printable as PDF.

## Tech stack

- TanStack Start (React 19, Vite 7, file-based routing)
- Tailwind CSS v4 with semantic OKLCH design tokens
- Lovable Cloud (Supabase Postgres + Auth) with RLS `auth.uid() = user_id`
- Recharts for visualisations, shadcn/ui for components
