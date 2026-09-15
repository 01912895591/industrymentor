
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Trash2, Pencil, Plus, Loader2, ArrowUpCircle, ArrowDownCircle, RefreshCw, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type FinanceCategory = { id: string; name: string };
type FinanceTxn = {
  id: string;
  created_at: string;
  txn_type: "income" | "expense";
  amount_cents: number;
  note: string | null;
  purchase_id: string | null;
  user_id: string | null;
  category_id: string | null;
};

export function FinanceAdmin() {
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [txns, setTxns] = useState<FinanceTxn[]>([]);
  const [busy, setBusy] = useState(false);

  // Transaction Forms
  const [txnType, setTxnType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Category Forms
  const [newCategory, setNewCategory] = useState("");

  // Edit State
  const [editingTxn, setEditingTxn] = useState<FinanceTxn | null>(null);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);

  const totals = useMemo(() => {
    const income = txns.filter((t) => t.txn_type === "income").reduce((a, t) => a + (t.amount_cents ?? 0), 0);
    const expense = txns.filter((t) => t.txn_type === "expense").reduce((a, t) => a + (t.amount_cents ?? 0), 0);
    return { income, expense, net: income - expense };
  }, [txns]);

  const load = async () => {
    setBusy(true);
    try {
      const [{ data: cData, error: cErr }, { data: tData, error: tErr }] = await Promise.all([
        (supabase as any).from("finance_categories").select("id,name").order("name", { ascending: true }),
        (supabase as any)
          .from("finance_transactions")
          .select("id,created_at,txn_type,amount_cents,note,purchase_id,user_id,category_id")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (cErr) throw cErr;
      if (tErr) throw tErr;
      setCategories(cData ?? []);
      setTxns(tData ?? []);
    } catch (e: any) {
      toast({ title: "Finance load failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onSaveTxn = async () => {
    const cents = Math.max(0, Math.round((Number(amount || 0) || 0) * 100));
    if (!cents) {
      toast({ title: "Valid amount is required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const payload = {
        txn_type: txnType,
        amount_cents: cents,
        note: note || null,
        category_id: categoryId || null,
      };

      if (editingTxn) {
        const { error } = await (supabase as any).from("finance_transactions").update(payload).eq("id", editingTxn.id);
        if (error) throw error;
        toast({ title: "Transaction updated" });
      } else {
        const { error } = await (supabase as any).from("finance_transactions").insert(payload);
        if (error) throw error;
        toast({ title: "Transaction added" });
      }

      setAmount("");
      setNote("");
      setEditingTxn(null);
      await load();
    } catch (e: any) {
      toast({ title: "Operation failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const onDeleteTxn = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    setBusy(true);
    try {
      const { error } = await (supabase as any).from("finance_transactions").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Transaction deleted" });
      await load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const onSaveCategory = async () => {
    if (!newCategory.trim()) return;
    setBusy(true);
    try {
      if (editingCategory) {
        const { error } = await (supabase as any).from("finance_categories").update({ name: newCategory.trim() }).eq("id", editingCategory.id);
        if (error) throw error;
        toast({ title: "Category updated" });
      } else {
        const { error } = await (supabase as any).from("finance_categories").insert({ name: newCategory.trim() });
        if (error) throw error;
        toast({ title: "Category added" });
      }
      setNewCategory("");
      setEditingCategory(null);
      await load();
    } catch (e: any) {
      toast({ title: "Operation failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const onDeleteCategory = async (id: string) => {
    if (!confirm("Delete category? Transactions using it will remain but without category link.")) return;
    setBusy(true);
    try {
      const { error } = await (supabase as any).from("finance_categories").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Category deleted" });
      await load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const startEditTxn = (t: FinanceTxn) => {
    setEditingTxn(t);
    setTxnType(t.txn_type);
    setAmount((t.amount_cents / 100).toString());
    setNote(t.note || "");
    setCategoryId(t.category_id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEditCategory = (c: FinanceCategory) => {
    setEditingCategory(c);
    setNewCategory(c.name);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="group rounded-xl border border-border/60 bg-card/40 p-6 shadow-xs transition-all hover:bg-card/60">
          <div className="flex items-center gap-2 text-xs font-bold text-green-500/80 uppercase tracking-wider">
            <ArrowUpCircle className="h-4 w-4" />
            Total Income
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-foreground">
            ৳{(totals.income / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="group rounded-xl border border-border/60 bg-card/40 p-6 shadow-xs transition-all hover:bg-card/60">
          <div className="flex items-center gap-2 text-xs font-bold text-red-500/80 uppercase tracking-wider">
            <ArrowDownCircle className="h-4 w-4" />
            Total Expense
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-foreground">
            ৳{(totals.expense / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="group rounded-xl border border-border/60 bg-card/40 p-6 shadow-xs transition-all hover:bg-card/60">
          <div className="flex items-center gap-2 text-xs font-bold text-primary/80 uppercase tracking-wider">
            <RefreshCw className="h-4 w-4" />
            Net Profit
          </div>
          <div className={`mt-2 text-3xl font-bold tabular-nums tracking-tight ${totals.net >= 0 ? "text-primary" : "text-red-500"}`}>
            ৳{(totals.net / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Entry Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border/60 bg-card/40 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2.5">
                {editingTxn ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                {editingTxn ? "Edit Transaction" : "Manual Entry"}
              </h2>
              {editingTxn && (
                <Button variant="ghost" size="sm" onClick={() => { setEditingTxn(null); setAmount(""); setNote(""); }} className="rounded-lg h-8 text-xs">
                  Cancel
                </Button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Type</Label>
                <div className="flex p-1 bg-background/40 rounded-xl border border-border/50">
                  <button
                    onClick={() => setTxnType("income")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${txnType === "income" ? "bg-primary text-white shadow-sm" : "hover:bg-background/60"}`}
                  >
                    Income
                  </button>
                  <button
                    onClick={() => setTxnType("expense")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${txnType === "expense" ? "bg-red-500 text-white shadow-sm" : "hover:bg-background/60"}`}
                  >
                    Expense
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Amount (BDT)</Label>
                <Input
                  inputMode="decimal"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="rounded-xl h-11 text-base font-bold bg-background/50"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Category</Label>
                <select
                  className="h-11 w-full rounded-xl border border-border/60 bg-background/40 px-3 text-sm font-semibold focus:ring-2 ring-primary transition-all outline-none"
                  value={categoryId ?? ""}
                  onChange={(e) => setCategoryId(e.target.value || null)}
                >
                  <option value="">General</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Note / Description</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What is this for?"
                  className="rounded-xl h-11 bg-background/50"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <Button
                variant="hero"
                size="lg"
                disabled={busy}
                onClick={() => void onSaveTxn()}
                className="flex-1 rounded-xl h-11 font-bold text-base shadow-xs"
              >
                {busy ? <Loader2 className="animate-spin h-5 w-5" /> : (editingTxn ? "Update Entry" : "Save Transaction")}
              </Button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">History</h2>
              <Button variant="soft" size="sm" onClick={() => void load()} disabled={busy} className="rounded-lg h-8 text-xs">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                Refresh
              </Button>
            </div>

            <div className="space-y-3">
              {txns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs border border-dashed border-border/60 rounded-xl">
                  No transactions found.
                </div>
              ) : (
                txns.map((t) => (
                  <div key={t.id} className="group relative flex items-center justify-between p-4 rounded-xl border border-border/70 bg-background/20 transition-all hover:bg-background/40 hover:border-primary/30">
                    <div className="flex items-center gap-3.5">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${t.txn_type === "income" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                        {t.txn_type === "income" ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">৳{(t.amount_cents / 100).toLocaleString()}</span>
                          {t.purchase_id && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/10 text-primary">System</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                          {t.note || "No description"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] font-medium uppercase tracking-wider opacity-70">
                          {new Date(t.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {categories.find(c => c.id === t.category_id)?.name || "General"}
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg" onClick={() => startEditTxn(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10 rounded-lg" onClick={() => onDeleteTxn(t.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-6 shadow-xs h-fit">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5">
            <RefreshCw className="h-5 w-5 text-primary" />
            Categories
          </h2>

          <div className="flex gap-2 mb-6">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={editingCategory ? "Rename category..." : "New category..."}
              className="rounded-xl h-10 text-xs bg-background/50"
            />
            <Button variant="hero" disabled={busy} onClick={() => void onSaveCategory()} className="rounded-xl px-4 h-10 shadow-xs text-xs font-bold">
              {editingCategory ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
            {editingCategory && (
              <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(null); setNewCategory(""); }} className="rounded-xl h-10 w-10">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {categories.length === 0 ? (
              <div className="text-xs text-muted-foreground italic text-center py-4">No categories yet.</div>
            ) : (
              categories.map((c) => (
                <div key={c.id} className="group flex items-center justify-between p-3 rounded-xl border border-border/70 bg-background/20 transition-all hover:border-primary/30">
                  <span className="font-semibold text-xs">{c.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => startEditCategory(c)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg" title="Edit category">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onDeleteCategory(c.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg" title="Delete category">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
