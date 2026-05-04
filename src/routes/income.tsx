import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ProtectedLayout } from "@/components/protected-layout";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { fmtMoney } from "@/lib/accounting";

export const Route = createFileRoute("/income")({ component: () => (
  <ProtectedLayout title="Income"><Inner /></ProtectedLayout>
)});

interface Income { id: string; source: string; amount: number; income_date: string; notes: string | null; }

const schema = z.object({
  source: z.string().trim().min(1).max(120),
  amount: z.number().positive(),
  income_date: z.string().min(1),
  notes: z.string().trim().max(500).optional(),
});

function Inner() {
  const { user } = useAuth();
  const [items, setItems] = useState<Income[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("incomes").select("*").order("income_date", { ascending: false });
    if (error) return toast.error(error.message);
    setItems((data ?? []) as Income[]);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const total = useMemo(() => items.reduce((s, i) => s + Number(i.amount), 0), [items]);

  const remove = async (id: string) => {
    if (!confirm("Delete this income entry?")) return;
    const { error } = await supabase.from("incomes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Total income</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold">{fmtMoney(total)}</p></CardContent>
      </Card>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Add income</Button></DialogTrigger>
          <IncomeDialog onSaved={() => { setOpen(false); load(); }} />
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No income recorded.</TableCell></TableRow>
                ) : items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="text-muted-foreground">{i.income_date}</TableCell>
                    <TableCell className="font-medium">{i.source}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{i.notes ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">{fmtMoney(Number(i.amount))}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(i.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
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

function IncomeDialog({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    source: "",
    amount: "",
    income_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse({
      source: form.source,
      amount: Number(form.amount),
      income_date: form.income_date,
      notes: form.notes || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    try {
      const { error } = await supabase.from("incomes").insert({ ...parsed.data, user_id: user.id });
      if (error) throw error;
      toast.success("Income added");
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Add income</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5"><Label>Source</Label>
          <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Sales, online order, etc." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Amount</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="space-y-1.5"><Label>Date</Label>
            <Input type="date" value={form.income_date} onChange={(e) => setForm({ ...form, income_date: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5"><Label>Notes</Label>
          <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
      <DialogFooter><Button onClick={submit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></DialogFooter>
    </DialogContent>
  );
}
