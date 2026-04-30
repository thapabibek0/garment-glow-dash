import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProtectedLayout } from "@/components/protected-layout";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Receipt, TrendingUp, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

interface Product {
  id: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
}
interface Expense {
  id: string;
  category: string;
  amount: number;
  expense_date: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

function DashboardPage() {
  return (
    <ProtectedLayout title="Dashboard">
      <DashboardInner />
    </ProtectedLayout>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, e] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("expenses").select("*"),
      ]);
      setProducts((p.data ?? []) as Product[]);
      setExpenses((e.data ?? []) as Expense[]);
    })();
  }, [user]);

  const stats = useMemo(() => {
    const inventoryValue = products.reduce((s, p) => s + p.cost_price * p.stock_quantity, 0);
    const potentialRevenue = products.reduce((s, p) => s + p.selling_price * p.stock_quantity, 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const lowStock = products.filter((p) => p.stock_quantity <= p.low_stock_threshold);
    const profit = potentialRevenue - inventoryValue - totalExpenses;
    return { inventoryValue, potentialRevenue, totalExpenses, lowStock, profit };
  }, [products, expenses]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [expenses]);

  const stockByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) map.set(p.category, (map.get(p.category) ?? 0) + p.stock_quantity);
    return Array.from(map, ([name, qty]) => ({ name, qty }));
  }, [products]);

  const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Inventory value" value={fmt(stats.inventoryValue)} hint={`${products.length} products`} />
        <StatCard icon={Receipt} label="Total expenses" value={fmt(stats.totalExpenses)} hint={`${expenses.length} entries`} />
        <StatCard
          icon={TrendingUp}
          label="Projected profit"
          value={fmt(stats.profit)}
          hint="Revenue − cost − expenses"
          tone={stats.profit >= 0 ? "success" : "destructive"}
        />
        <StatCard
          icon={AlertTriangle}
          label="Low stock"
          value={String(stats.lowStock.length)}
          hint="Items at/below threshold"
          tone={stats.lowStock.length ? "warning" : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Expenses by category</CardTitle></CardHeader>
          <CardContent className="h-72">
            {expensesByCategory.length === 0 ? (
              <Empty text="No expenses yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensesByCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                    {expensesByCategory.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Stock by category</CardTitle></CardHeader>
          <CardContent className="h-72">
            {stockByCategory.length === 0 ? (
              <Empty text="No products yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.lowStock.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Low stock alerts</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {stats.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                  </div>
                  <span className="rounded-md bg-warning/15 px-2 py-1 text-xs font-medium text-warning-foreground">
                    {p.stock_quantity} left
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  hint?: string;
  tone?: "success" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "success" ? "text-success" :
    tone === "warning" ? "text-warning" :
    tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{text}</div>;
}
