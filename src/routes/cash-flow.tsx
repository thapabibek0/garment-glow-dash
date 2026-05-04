import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccountingData } from "@/lib/use-accounting-data";
import { fmtMoney } from "@/lib/accounting";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";

export const Route = createFileRoute("/cash-flow")({ component: () => (
  <ProtectedLayout title="Cash Flow"><Inner /></ProtectedLayout>
)});

function Inner() {
  const { stats } = useAccountingData();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2"><ArrowDownCircle className="h-4 w-4 text-success" /> Cash In</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-success">{fmtMoney(stats.cashIn)}</p>
            <p className="mt-1 text-xs text-muted-foreground">From income</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2"><ArrowUpCircle className="h-4 w-4 text-destructive" /> Cash Out</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{fmtMoney(stats.cashOut)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Expenses + inventory purchases</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4" /> Net Cash Flow</CardTitle></CardHeader>
          <CardContent><p className={`text-2xl font-bold ${stats.netCash >= 0 ? "text-success" : "text-destructive"}`}>{fmtMoney(stats.netCash)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Breakdown</CardTitle></CardHeader>
        <CardContent>
          <dl className="divide-y text-sm">
            <Row label="Total income" value={fmtMoney(stats.totalIncome)} />
            <Row label="Total expenses" value={`− ${fmtMoney(stats.totalExpenses)}`} />
            <Row label="Inventory purchases" value={`− ${fmtMoney(stats.inventoryPurchases)}`} />
            <Row label="Net cash flow" value={fmtMoney(stats.netCash)} bold />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={bold ? "font-bold" : "font-medium"}>{value}</dd>
    </div>
  );
}
