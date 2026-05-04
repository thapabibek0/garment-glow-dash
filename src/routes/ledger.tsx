import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccountingData } from "@/lib/use-accounting-data";
import { fmtMoney } from "@/lib/accounting";

export const Route = createFileRoute("/ledger")({ component: () => (
  <ProtectedLayout title="General Ledger"><Inner /></ProtectedLayout>
)});

function Inner() {
  const { ledger, loading } = useAccountingData();
  const grouped = ledger.reduce<Record<string, typeof ledger>>((acc, l) => {
    (acc[l.category] ??= []).push(l); return acc;
  }, {});

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Account-wise totals derived from income, expenses, and inventory purchases.
      </p>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : Object.entries(grouped).map(([cat, accounts]) => (
        <Card key={cat}>
          <CardHeader><CardTitle className="text-base">{cat}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Running balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.account}>
                    <TableCell className="font-medium">{a.account}</TableCell>
                    <TableCell className="text-right">{fmtMoney(a.debit)}</TableCell>
                    <TableCell className="text-right">{fmtMoney(a.credit)}</TableCell>
                    <TableCell className="text-right font-medium">{fmtMoney(a.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
