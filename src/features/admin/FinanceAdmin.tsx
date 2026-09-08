
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
        <div className="group rounded-[2rem] border border-border/60 bg-card/25 p-8 shadow-elev transition-all hover:bg-card/40">
          <div className="flex items-center gap-2 text-sm font-bold text-green-500/80 uppercase tracking-wider">
            <ArrowUpCircle className="h-4 w-4" />
            Total Income
          </div>
          <div className="mt-3 text-4xl font-black tabular-nums tracking-tight text-foreground">
            ৳{(totals.income / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="group rounded-[2rem] border border-border/60 bg-card/25 p-8 shadow-elev transition-all hover:bg-card/40">
          <div className="flex items-center gap-2 text-sm font-bold text-red-500/80 uppercase tracking-wider">
            <ArrowDownCircle className="h-4 w-4" />
            Total Expense
          </div>
          <div className="mt-3 text-4xl font-black tabular-nums tracking-tight text-foreground">
            ৳{(totals.expense / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="group rounded-[2rem] border border-border/60 bg-card/25 p-8 shadow-elev transition-all hover:bg-card/40">
          <div className="flex items-center gap-2 text-sm font-bold text-primary/80 uppercase tracking-wider">
            <RefreshCw className="h-4 w-4" />
            Net Profit
          </div>
          <div className={`mt-3 text-4xl font-black tabular-nums tracking-tight ${totals.net >= 0 ? "text-primary" : "text-red-500"}`}>
            ৳{(totals.net / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Entry Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[2.5rem] border border-border/60 bg-card/25 p-8 shadow-elev">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black flex items-center gap-3">
                {editingTxn ? <Pencil className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
                {editingTxn ? "Edit Transaction" : "Manual Entry"}
              </h2>
              {editingTxn && (
                <Button variant="ghost" size="sm" onClick={() => { setEditingTxn(null); setAmount(""); setNote(""); }} className="rounded-xl">
                  Cancel
                </Button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest opacity-60">Type</Label>
                <div className="flex p-1 bg-background/40 rounded-2xl border border-border/50">
                  <button
                    onClick={() => setTxnType("income")}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${txnType === "income" ? "bg-primary text-white shadow-lg" : "hover:bg-background/60"}`}
                  >
                    Income
                  </button>
                  <button
                    onClick={() => setTxnType("expense")}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${txnType === "expense" ? "bg-red-500 text-white shadow-lg" : "hover:bg-background/60"}`}
                  >
                    Expense
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest opacity-60">Amount (BDT)</Label>
                <Input
                  inputMode="decimal"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="rounded-2xl h-14 text-lg font-bold"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest opacity-60">Category</Label>
                <select
                  className="h-14 w-full rounded-2xl border border-border/60 bg-background/20 px-4 text-sm font-bold focus:ring-2 ring-primary transition-all outline-none"
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

              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest opacity-60">Note / Description</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What is this for?"
                  className="rounded-2xl h-14"
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <Button
                variant="hero"
                size="lg"
                disabled={busy}
                onClick={() => void onSaveTxn()}
                className="flex-1 rounded-2xl h-14 font-black text-lg shadow-glow"
              >
                {busy ? <Loader2 className="animate-spin h-5 w-5" /> : (editingTxn ? "Update Entry" : "Save Transaction")}
              </Button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="rounded-[2.5rem] border border-border/60 bg-card/25 p-8 shadow-elev">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black">History</h2>
              <Button variant="soft" size="sm" onClick={() => void load()} disabled={busy} className="rounded-xl">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Refresh
              </Button>
            </div>

            <div className="space-y-3">
              {txns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground italic border-2 border-dashed rounded-[2rem]">
                  No transactions found.
                </div>
              ) : (
                txns.map((t) => (
                  <div key={t.id} className="group relative flex items-center justify-between p-5 rounded-[1.5rem] border border-border/70 bg-background/20 transition-all hover:bg-background/40 hover:border-primary/30">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${t.txn_type === "income" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                        {t.txn_type === "income" ? <ArrowUpCircle className="h-6 w-6" /> : <ArrowDownCircle className="h-6 w-6" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-lg">৳{(t.amount_cents / 100).toLocaleString()}</span>
                          {t.purchase_id && <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary">System</span>}
                        </div>
                        <div className="text-xs text-muted-foreground font-bold mt-1 max-w-[200px] truncate">
                          {t.note || "No description"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] font-black uppercase tracking-wider opacity-60">
                          {new Date(t.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground italic">
                          {categories.find(c => c.id === t.category_id)?.name || "General"}
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary/10 rounded-xl" onClick={() => startEditTxn(t)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:bg-red-500/10 rounded-xl" onClick={() => onDeleteTxn(t.id)}>
                          <Trash2 className="h-4 w-4" />
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
        <div className="rounded-[2.5rem] border border-border/60 bg-card/25 p-8 shadow-elev h-fit">
          <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
            <RefreshCw className="h-6 w-6 text-primary" />
            Categories
          </h2>

          <div className="flex gap-2 mb-8">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={editingCategory ? "Rename category..." : "New category..."}
              className="rounded-xl h-12"
            />
            <Button variant="hero" disabled={busy} onClick={() => void onSaveCategory()} className="rounded-xl px-5 h-12 shadow-md">
              {editingCategory ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
            {editingCategory && (
              <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(null); setNewCategory(""); }} className="rounded-xl h-12 w-12">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {categories.length === 0 ? (
              <div className="text-sm text-muted-foreground italic text-center py-4">No categories yet.</div>
            ) : (
              categories.map((c) => (
                <div key={c.id} className="group flex items-center justify-between p-4 rounded-2xl border border-border/70 bg-background/15 transition-all hover:border-primary/30">
                  <span className="font-bold text-sm">{c.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90">
                    <button onClick={() => startEditCategory(c)} className="p-2 text-primary hover:bg-primary/10 rounded-xl">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDeleteCategory(c.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl">
                      <Trash2 className="h-4 w-4" />
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

function Edit({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
