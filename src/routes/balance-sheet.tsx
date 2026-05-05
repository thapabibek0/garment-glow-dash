import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccountingData } from "@/lib/use-accounting-data";
import { fmtMoney } from "@/lib/accounting";

export const Route = createFileRoute("/balance-sheet")({
  component: () => (<ProtectedLayout title="Balance Sheet"><Inner /></ProtectedLayout>),
});

function Inner() {
  const { stats } = useAccountingData();
  const cash = stats.netCash;
  const inventory = stats.inventoryValue;
  const totalAssets = cash + inventory;
  const liabilities = 0;
  const equity = totalAssets - liabilities;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Snapshot of what you own (assets) versus what you owe (liabilities). Equity = Assets − Liabilities.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Assets</CardTitle></CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              <Row label="Cash" value={fmtMoney(cash)} />
              <Row label="Inventory" value={fmtMoney(inventory)} />
              <Row label="Total Assets" value={fmtMoney(totalAssets)} bold />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Liabilities & Equity</CardTitle></CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              <Row label="Liabilities" value={fmtMoney(liabilities)} />
              <Row label="Owner's Equity" value={fmtMoney(equity)} />
              <Row label="Total" value={fmtMoney(liabilities + equity)} bold />
            </dl>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Accounting equation: <span className="font-medium text-foreground">Assets {fmtMoney(totalAssets)} = Liabilities {fmtMoney(liabilities)} + Equity {fmtMoney(equity)}</span>
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
