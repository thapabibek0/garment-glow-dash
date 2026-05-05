import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccountingData } from "@/lib/use-accounting-data";
import { fmtMoney } from "@/lib/accounting";
import { ExportButtons } from "@/components/export-buttons";
import { exportCSV, exportPDF } from "@/lib/export-utils";

export const Route = createFileRoute("/journal")({ component: () => (
  <ProtectedLayout title="Journal Entries"><Inner /></ProtectedLayout>
)});

function Inner() {
  const { journal, loading } = useAccountingData();
  const headers = ["Date", "Type", "Description", "Debit", "Credit", "Amount"];
  const rows = journal.map((j) => [j.date, j.type, j.description, j.debit_account, j.credit_account, j.amount.toFixed(2)]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Auto-generated from every income, expense, and inventory purchase.</p>
        <ExportButtons
          onCSV={() => exportCSV("journal", headers, rows)}
          onPDF={() => exportPDF("journal", "Journal Entries", [{ headers, rows }])}
        /></div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Debit</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>
                ) : journal.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No journal entries yet.</TableCell></TableRow>
                ) : journal.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="text-muted-foreground">{j.date}</TableCell>
                    <TableCell className="capitalize">{j.type}</TableCell>
                    <TableCell>{j.description}</TableCell>
                    <TableCell className="text-success">{j.debit_account}</TableCell>
                    <TableCell className="text-destructive">{j.credit_account}</TableCell>
                    <TableCell className="text-right font-medium">{fmtMoney(j.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
