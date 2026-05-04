import { createFileRoute } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/protected-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccountingData } from "@/lib/use-accounting-data";
import { fmtMoney } from "@/lib/accounting";

export const Route = createFileRoute("/journal")({ component: () => (
  <ProtectedLayout title="Journal Entries"><Inner /></ProtectedLayout>
)});

function Inner() {
  const { journal, loading } = useAccountingData();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Auto-generated from every income, expense, and inventory purchase.</p>
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
