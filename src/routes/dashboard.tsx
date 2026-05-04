import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Receipt, TrendingUp, AlertTriangle, Wallet, Coins, BarChart3, ArrowUpRight } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAccountingData } from "@/lib/use-accounting-data";
import { fmtMoney } from "@/lib/accounting";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  return (
    <ProtectedLayout title="Dashboard">
      <DashboardInner />
    </ProtectedLayout>
  );
}

interface ProductLite { id: string; name: string; category?: string; stock_quantity: number; low_stock_threshold?: number; }

function DashboardInner() {
  const { products, expenses, stats } = useAccountingData();
  const pp = products as unknown as ProductLite[];

  const lowStock = useMemo(
    () => pp.filter((p) => p.stock_quantity <= (p.low_stock_threshold ?? 5)),
    [pp]
  );

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [expenses]);

  const stockByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of pp) {
      const cat = p.category ?? "Other";
      map.set(cat, (map.get(cat) ?? 0) + p.stock_quantity);
    }
    return Array.from(map, ([name, qty]) => ({ name, qty }));
  }, [pp]);

  const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Coins} label="Total Assets" value={fmtMoney(stats.totalAssets)} hint="Cash + inventory" />
        <StatCard icon={ArrowUpRight} label="Total Income" value={fmtMoney(stats.totalIncome)} tone="success" />
        <StatCard icon={Receipt} label="Total Expenses" value={fmtMoney(stats.totalExpenses)} tone="destructive" />
        <StatCard icon={TrendingUp} label="Net Profit" value={fmtMoney(stats.netProfit)} tone={stats.netProfit >= 0 ? "success" : "destructive"} />
        <StatCard icon={Package} label="Inventory Value" value={fmtMoney(stats.inventoryValue)} hint={`${pp.length} products`} />
        <StatCard icon={Wallet} label="Net Cash Flow" value={fmtMoney(stats.netCash)} tone={stats.netCash >= 0 ? "success" : "destructive"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BarChart3} label="Cash In" value={fmtMoney(stats.cashIn)} />
        <StatCard icon={BarChart3} label="Cash Out" value={fmtMoney(stats.cashOut)} />
        <StatCard icon={Package} label="Inventory Purchases" value={fmtMoney(stats.inventoryPurchases)} />
        <StatCard
          icon={AlertTriangle}
          label="Low stock"
          value={String(lowStock.length)}
          hint="Items at/below threshold"
          tone={lowStock.length ? "warning" : undefined}
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
                  <Tooltip formatter={(v: number) => fmtMoney(v)} />
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

      {lowStock.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Low stock alerts</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category ?? "—"}</p>
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
  icon: Icon, label, value, hint, tone,
}: {
  icon: typeof Package;
  label: string; value: string; hint?: string;
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
