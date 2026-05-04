import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccountingData } from "@/lib/use-accounting-data";
import { fmtMoney } from "@/lib/accounting";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/trial-balance")({ component: () => (
  <ProtectedLayout title="Trial Balance"><Inner /></ProtectedLayout>
)});

function Inner() {
  const { ledger } = useAccountingData();
  const totalDebit = ledger.reduce((s, l) => s + l.debit, 0);
  const totalCredit = ledger.reduce((s, l) => s + l.credit, 0);
  const diff = totalDebit - totalCredit;
  const balanced = Math.abs(diff) < 0.01;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Total Debit</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmtMoney(totalDebit)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Total Credit</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmtMoney(totalCredit)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Status</CardTitle></CardHeader>
          <CardContent>
            <div className={`flex items-center gap-2 text-lg font-semibold ${balanced ? "text-success" : "text-destructive"}`}>
              {balanced ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {balanced ? "Balanced" : `Off by ${fmtMoney(Math.abs(diff))}`}
            </div>
          </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((l) => (
                <TableRow key={l.account}>
                  <TableCell className="font-medium">{l.account}</TableCell>
                  <TableCell className="text-muted-foreground">{l.category}</TableCell>
                  <TableCell className="text-right">{fmtMoney(l.debit)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(l.credit)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 font-bold">
                <TableCell colSpan={2}>Totals</TableCell>
                <TableCell className="text-right">{fmtMoney(totalDebit)}</TableCell>
                <TableCell className="text-right">{fmtMoney(totalCredit)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
