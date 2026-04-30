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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, Minus, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/inventory")({ component: InventoryPage });

interface Product {
  id: string;
  name: string;
  category: string;
  size: string | null;
  color: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
}

const CATEGORIES = ["Tops", "Bottoms", "Dresses", "Outerwear", "Footwear", "Accessories", "Other"];

const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().min(1),
  size: z.string().trim().max(20).optional(),
  color: z.string().trim().max(40).optional(),
  cost_price: z.number().min(0),
  selling_price: z.number().min(0),
  stock_quantity: z.number().int().min(0),
  low_stock_threshold: z.number().int().min(0),
});

const fmt = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

function InventoryPage() {
  return (
    <ProtectedLayout title="Inventory">
      <InventoryInner />
    </ProtectedLayout>
  );
}

function InventoryInner() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setProducts((data ?? []) as Product[]);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.color?.toLowerCase().includes(search.toLowerCase());
      const matchesCat = filter === "all" || p.category === filter;
      return matchesSearch && matchesCat;
    });
  }, [products, search, filter]);

  const adjustStock = async (p: Product, delta: number) => {
    if (!user) return;
    const next = Math.max(0, p.stock_quantity + delta);
    const { error } = await supabase.from("products").update({ stock_quantity: next }).eq("id", p.id);
    if (error) return toast.error(error.message);
    await supabase.from("inventory_logs").insert({
      user_id: user.id,
      product_id: p.id,
      change_type: delta > 0 ? "add" : "reduce",
      quantity: Math.abs(delta),
    });
    load();
  };

  const removeProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Product deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or color"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add product</Button>
          </DialogTrigger>
          <ProductDialog
            initial={editing}
            onSaved={() => { setDialogOpen(false); setEditing(null); load(); }}
          />
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No products yet. Add your first one.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((p) => {
                  const low = p.stock_quantity <= p.low_stock_threshold;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.category}</TableCell>
                      <TableCell className="text-muted-foreground">{p.size ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.color ?? "—"}</TableCell>
                      <TableCell className="text-right">{fmt(p.cost_price)}</TableCell>
                      <TableCell className="text-right">{fmt(p.selling_price)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => adjustStock(p, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className={`min-w-8 text-center text-sm font-medium ${low ? "text-warning" : ""}`}>
                            {p.stock_quantity}
                            {low && <AlertTriangle className="ml-1 inline h-3 w-3" />}
                          </span>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => adjustStock(p, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(p); setDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeProduct(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductDialog({ initial, onSaved }: { initial: Product | null; onSaved: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    category: initial?.category ?? CATEGORIES[0],
    size: initial?.size ?? "",
    color: initial?.color ?? "",
    cost_price: initial?.cost_price?.toString() ?? "0",
    selling_price: initial?.selling_price?.toString() ?? "0",
    stock_quantity: initial?.stock_quantity?.toString() ?? "0",
    low_stock_threshold: initial?.low_stock_threshold?.toString() ?? "5",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return;
    const parsed = productSchema.safeParse({
      name: form.name,
      category: form.category,
      size: form.size || undefined,
      color: form.color || undefined,
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      stock_quantity: Number(form.stock_quantity),
      low_stock_threshold: Number(form.low_stock_threshold),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSaving(true);
    try {
      if (initial) {
        const { error } = await supabase.from("products").update(parsed.data).eq("id", initial.id);
        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { error } = await supabase.from("products").insert({ ...parsed.data, user_id: user.id });
        if (error) throw error;
        toast.success("Product added");
      }
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const fld = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>{initial ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label>Name</Label>
          <Input {...fld("name")} placeholder="Linen shirt" />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Size</Label><Input {...fld("size")} placeholder="M" /></div>
        <div className="space-y-1.5"><Label>Color</Label><Input {...fld("color")} placeholder="Beige" /></div>
        <div className="space-y-1.5"><Label>Stock</Label><Input type="number" {...fld("stock_quantity")} /></div>
        <div className="space-y-1.5"><Label>Cost price</Label><Input type="number" step="0.01" {...fld("cost_price")} /></div>
        <div className="space-y-1.5"><Label>Selling price</Label><Input type="number" step="0.01" {...fld("selling_price")} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Low stock alert at</Label><Input type="number" {...fld("low_stock_threshold")} /></div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
