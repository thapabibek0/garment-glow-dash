// Derived accounting helpers. Journals are auto-generated from existing
// incomes / expenses / inventory_logs + products tables.

export interface Income { id: string; source: string; amount: number; income_date: string; notes: string | null; }
export interface Expense { id: string; category: string; amount: number; expense_date: string; notes: string | null; }
export interface Product { id: string; name: string; cost_price: number; stock_quantity: number; }
export interface InventoryLog {
  id: string; product_id: string; change_type: string; quantity: number; created_at: string;
}

export type JournalType = "income" | "expense" | "inventory";
export interface JournalEntry {
  id: string;
  type: JournalType;
  reference_id: string;
  date: string;
  amount: number;
  description: string;
  debit_account: string;
  credit_account: string;
}

export const ACCOUNTS = {
  Cash: "Assets",
  Inventory: "Assets",
  Income: "Income",
  Expenses: "Expenses",
} as const;

export function buildJournal(
  incomes: Income[],
  expenses: Expense[],
  logs: InventoryLog[],
  productMap: Map<string, Product>,
): JournalEntry[] {
  const entries: JournalEntry[] = [];

  for (const i of incomes) {
    entries.push({
      id: `inc-${i.id}`,
      type: "income",
      reference_id: i.id,
      date: i.income_date,
      amount: Number(i.amount),
      description: `Income: ${i.source}`,
      debit_account: "Cash",
      credit_account: "Income",
    });
  }

  for (const e of expenses) {
    entries.push({
      id: `exp-${e.id}`,
      type: "expense",
      reference_id: e.id,
      date: e.expense_date,
      amount: Number(e.amount),
      description: `Expense: ${e.category}`,
      debit_account: "Expenses",
      credit_account: "Cash",
    });
  }

  for (const log of logs) {
    if (log.change_type !== "add") continue; // only purchases hit the ledger
    const p = productMap.get(log.product_id);
    if (!p) continue;
    const amount = Number(p.cost_price) * log.quantity;
    if (amount <= 0) continue;
    entries.push({
      id: `inv-${log.id}`,
      type: "inventory",
      reference_id: log.id,
      date: log.created_at.slice(0, 10),
      amount,
      description: `Inventory purchase: ${p.name} x${log.quantity}`,
      debit_account: "Inventory",
      credit_account: "Cash",
    });
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

export interface LedgerAccount {
  account: string;
  category: string;
  debit: number;
  credit: number;
  balance: number; // debit - credit (positive for assets/expenses, negative for income/liabilities)
}

export function buildLedger(entries: JournalEntry[]): LedgerAccount[] {
  const map = new Map<string, { debit: number; credit: number }>();
  for (const acc of Object.keys(ACCOUNTS)) map.set(acc, { debit: 0, credit: 0 });
  for (const e of entries) {
    map.get(e.debit_account)!.debit += e.amount;
    map.get(e.credit_account)!.credit += e.amount;
  }
  return Array.from(map, ([account, v]) => ({
    account,
    category: ACCOUNTS[account as keyof typeof ACCOUNTS],
    debit: v.debit,
    credit: v.credit,
    balance: v.debit - v.credit,
  }));
}

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
