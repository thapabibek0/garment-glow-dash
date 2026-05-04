import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccountingData } from "@/lib/use-accounting-data";
import { fmtMoney } from "@/lib/accounting";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/reports")({ component: () => (
  <ProtectedLayout title="Reports"><Inner /></ProtectedLayout>
)});

function Inner() {
  const { stats, ledger } = useAccountingData();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Profit &amp; Loss</CardTitle></CardHeader>
        <CardContent>
          <dl className="divide-y text-sm">
            <Row label="Total income" value={fmtMoney(stats.totalIncome)} />
            <Row label="Total expenses" value={`− ${fmtMoney(stats.totalExpenses)}`} />
            <Row label="Net profit" value={fmtMoney(stats.netProfit)} bold tone={stats.netProfit >= 0 ? "success" : "destructive"} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Cash Flow</CardTitle></CardHeader>
        <CardContent>
          <dl className="divide-y text-sm">
            <Row label="Cash in" value={fmtMoney(stats.cashIn)} />
            <Row label="Cash out" value={`− ${fmtMoney(stats.cashOut)}`} />
            <Row label="Net cash flow" value={fmtMoney(stats.netCash)} bold tone={stats.netCash >= 0 ? "success" : "destructive"} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ledger Summary</CardTitle></CardHeader>
        <CardContent>
          <dl className="divide-y text-sm">
            {ledger.map((l) => (
              <Row key={l.account} label={`${l.account} (${l.category})`} value={fmtMoney(l.balance)} />
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: "success" | "destructive" }) {
  const cls = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "";
  return (
    <div className="flex items-center justify-between py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`${bold ? "font-bold" : "font-medium"} ${cls}`}>{value}</dd>
    </div>
  );
}
