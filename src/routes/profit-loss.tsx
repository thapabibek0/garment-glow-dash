import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccountingData } from "@/lib/use-accounting-data";
import { fmtMoney } from "@/lib/accounting";
import { ExportButtons } from "@/components/export-buttons";
import { exportCSV, exportPDF } from "@/lib/export-utils";

export const Route = createFileRoute("/profit-loss")({
  component: () => (<ProtectedLayout title="Profit & Loss"><Inner /></ProtectedLayout>),
});

function Inner() {
  const { incomes, expenses, stats } = useAccountingData();

  const incomeBySource = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of incomes) m.set(i.source, (m.get(i.source) ?? 0) + Number(i.amount));
    return Array.from(m, ([k, v]) => ({ name: k, value: v }));
  }, [incomes]);

  const expenseByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of expenses) m.set(e.category, (m.get(e.category) ?? 0) + Number(e.amount));
    return Array.from(m, ([k, v]) => ({ name: k, value: v }));
  }, [expenses]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-success">{fmtMoney(stats.totalIncome)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Expenses</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{fmtMoney(stats.totalExpenses)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Net Profit ({stats.grossMargin.toFixed(1)}%)</CardTitle></CardHeader>
          <CardContent><p className={`text-2xl font-bold ${stats.netProfit >= 0 ? "text-success" : "text-destructive"}`}>{fmtMoney(stats.netProfit)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Revenue breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Section rows={incomeBySource} total={stats.totalIncome} emptyText="No income recorded." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Expense breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Section rows={expenseByCategory} total={stats.totalExpenses} emptyText="No expenses recorded." />
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ rows, total, emptyText }: { rows: { name: string; value: number }[]; total: number; emptyText: string }) {
  if (rows.length === 0) return <p className="p-6 text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <Table>
      <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Share</TableHead></TableRow></TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.name}>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell className="text-right">{fmtMoney(r.value)}</TableCell>
            <TableCell className="text-right text-muted-foreground">{total > 0 ? ((r.value / total) * 100).toFixed(1) : "0.0"}%</TableCell>
          </TableRow>
        ))}
        <TableRow className="border-t-2 font-bold">
          <TableCell>Total</TableCell>
          <TableCell className="text-right">{fmtMoney(total)}</TableCell>
          <TableCell className="text-right">100%</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
