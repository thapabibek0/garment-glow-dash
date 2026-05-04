import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  buildJournal, buildLedger,
  type Income, type Expense, type Product, type InventoryLog,
} from "./accounting";

export function useAccountingData() {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [i, e, p, l] = await Promise.all([
        supabase.from("incomes").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("products").select("id,name,cost_price,stock_quantity,low_stock_threshold,category"),
        supabase.from("inventory_logs").select("*"),
      ]);
      if (cancelled) return;
      setIncomes((i.data ?? []) as Income[]);
      setExpenses((e.data ?? []) as Expense[]);
      setProducts((p.data ?? []) as Product[]);
      setLogs((l.data ?? []) as InventoryLog[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const journal = buildJournal(incomes, expenses, logs, productMap);
  const ledger = buildLedger(journal);

  const totalIncome = incomes.reduce((s, x) => s + Number(x.amount), 0);
  const totalExpenses = expenses.reduce((s, x) => s + Number(x.amount), 0);
  const inventoryValue = products.reduce((s, p) => s + Number(p.cost_price) * p.stock_quantity, 0);
  const inventoryPurchases = journal
    .filter((j) => j.type === "inventory")
    .reduce((s, j) => s + j.amount, 0);
  const cashIn = totalIncome;
  const cashOut = totalExpenses + inventoryPurchases;
  const netCash = cashIn - cashOut;
  const netProfit = totalIncome - totalExpenses;
  const totalAssets = inventoryValue + netCash; // simplified: cash + inventory

  return {
    loading, incomes, expenses, products, logs, journal, ledger,
    stats: { totalIncome, totalExpenses, inventoryValue, inventoryPurchases, cashIn, cashOut, netCash, netProfit, totalAssets },
  };
}
