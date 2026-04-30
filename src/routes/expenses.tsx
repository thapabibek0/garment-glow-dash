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
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/expenses")({ component: ExpensesPage });

interface Expense {
  id: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
}

const CATEGORIES = ["Rent", "Salary", "Transport", "Materials", "Marketing", "Utilities", "Other"];

const schema = z.object({
  category: z.string().min(1),
  amount: z.number().positive("Amount must be > 0"),
  expense_date: z.string().min(1),
  notes: z.string().trim().max(500).optional(),
});

const fmt = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

function ExpensesPage() {
  return (
    <ProtectedLayout title="Expenses">
      <ExpensesInner />
    </ProtectedLayout>
  );
}

function ExpensesInner() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterCat, setFilterCat] = useState("all");
  const [filterMonth, setFilterMonth] = useState<string>(""); // YYYY-MM
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });
    if (error) return toast.error(error.message);
    setExpenses((data ?? []) as Expense[]);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const catOk = filterCat === "all" || e.category === filterCat;
      const monthOk = !filterMonth || e.expense_date.startsWith(filterMonth);
      return catOk && monthOk;
    });
  }, [expenses, filterCat, filterMonth]);

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const monthlySummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const m = e.expense_date.slice(0, 7);
      map.set(m, (map.get(m) ?? 0) + Number(e.amount));
    }
    return Array.from(map, ([month, amount]) => ({ month, amount }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6);
  }, [expenses]);

  const remove = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Filtered total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(total)}</p></CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-normal text-muted-foreground">Recent months</CardTitle></CardHeader>
          <CardContent>
            {monthlySummary.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {monthlySummary.map((m) => (
                  <button
                    key={m.month}
                    onClick={() => setFilterMonth(m.month === filterMonth ? "" : m.month)}
                    className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                      filterMonth === m.month ? "border-primary bg-primary/10" : "hover:bg-accent"
                    }`}
                  >
                    <span className="font-medium">{m.month}</span>
                    <span className="ml-2 text-muted-foreground">{fmt(m.amount)}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full sm:w-44"
          />
          {(filterCat !== "all" || filterMonth) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterCat("all"); setFilterMonth(""); }}>
              Clear
            </Button>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add expense</Button>
          </DialogTrigger>
          <ExpenseDialog onSaved={() => { setDialogOpen(false); load(); }} />
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No expenses match.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{e.expense_date}</TableCell>
                    <TableCell className="font-medium">{e.category}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{e.notes ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(Number(e.amount))}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(e.id)}>
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

function ExpenseDialog({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    category: CATEGORIES[0],
    amount: "",
    expense_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse({
      category: form.category,
      amount: Number(form.amount),
      expense_date: form.expense_date,
      notes: form.notes || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    try {
      const { error } = await supabase.from("expenses").insert({ ...parsed.data, user_id: user.id });
      if (error) throw error;
      toast.success("Expense added");
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Add expense</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" step="0.01" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={form.expense_date}
              onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea rows={3} value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional details" />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
