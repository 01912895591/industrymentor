import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { DemoCatalogItem } from "@/features/library/demoCatalog";
import { ensurePurchased } from "@/features/library/demoCatalog";
import { downloadDemoFile } from "@/features/library/download";
import { usePurchases } from "@/features/library/usePurchases";

const tocByKey: Record<string, string[]> = {
  "ebook-sizing-basics": [
    "How to measure garments (POM)",
    "Tolerances and fit standards",
    "Fit checks: before, during, after sewing",
    "Common fit issues and fixes",
  ],
  "ebook-production-planning": [
    "Daily line planning essentials",
    "Capacity and bottleneck mapping",
    "WIP control and targets",
    "End-of-day reporting template",
  ],
  "ebook-quality-audit": [
    "Inline inspection checklist",
    "Final inspection checklist",
    "Defect classification",
    "Corrective actions and follow-up",
  ],
  "sop-inline-inspection": [
    "Purpose and scope",
    "Inspector responsibilities",
    "Sampling plan (demo)",
    "Defect logging format",
  ],
  "sop-cutting-room": [
    "Fabric relaxation workflow",
    "Marker approval steps",
    "Cut panel bundling",
    "Tracking and reconciliation",
  ],
  "sop-packing-final": [
    "Carton planning",
    "Labeling and barcode checks",
    "Metal detection steps",
    "Shipment handover",
  ],
};

export function LibraryItemDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: "ebook" | "sop";
  item: DemoCatalogItem;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: purchases = [] } = usePurchases();
  const { open, onOpenChange, itemType, item } = props;

  const isPurchased = useMemo(() => {
    return purchases.some((p) => p.item_type === itemType && p.item_key === item.key);
  }, [purchases, item.key, itemType]);

  const toc = tocByKey[item.key] ?? ["Overview", "Key concepts", "Templates (demo)", "Quick checklist"];

  const [isPaying, setIsPaying] = useState(false);
  const [txnId, setTxnId] = useState("");

  async function handleConfirmPurchase() {
    if (!user) {
      navigate(`/auth?mode=login&buy_key=${item.key}`);
      return;
    }

    setIsPaying(true);
    try {
      await ensurePurchased({ userId: user.id, itemType, item, transactionId: txnId });
      await queryClient.invalidateQueries({ queryKey: ["purchases", user.id] });
      toast({ title: "Payment submitted", description: "Download unlocked." });
    } finally {
      setIsPaying(false);
    }
  }

  async function handleDownload() {
    if (!isPurchased) return;

    try {
      // 1. Fetch the file path from library_items
      const { data: itemData, error: itemError } = await supabase
        .from("library_items")
        .select("file_path")
        .eq("item_key", item.key)
        .single();

      if (itemError || !itemData?.file_path) {
        console.error("File not found:", itemError);
        toast({ title: "Download failed", description: "File reference missing.", variant: "destructive" });
        return;
      }

      // 2. Create a signed URL (valid for 60 seconds)
      const { data, error } = await supabase.storage
        .from("library")
        .createSignedUrl(itemData.file_path, 60);

      if (error || !data?.signedUrl) {
        console.error("Download error:", error);
        toast({ title: "Download failed", description: "Could not generate link.", variant: "destructive" });
        return;
      }

      // 3. Trigger download
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.target = "_blank"; // Open in new tab or download depending on browser settings
      link.download = item.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh] p-6">
          <div className="grid gap-6 md:grid-cols-[1.4fr_0.6fr]">
            <div className="flex flex-col gap-6 sm:flex-row">
              {/* Cover Image Section */}
              <div className="flex-shrink-0">
                <div className="aspect-[3/4] w-full sm:w-48 overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-sm">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary/30">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /><path d="M8 6h10" /><path d="M8 10h10" /><path d="M8 14h10" /></svg>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">{item.title}</DialogTitle>
                  <DialogDescription className="text-base line-clamp-3">{item.description}</DialogDescription>
                </DialogHeader>

                <div className="mt-5 rounded-3xl border border-border/60 bg-card/25 p-5">
                  <div className="text-sm font-bold opacity-80 uppercase tracking-wider">Book Preview / Content</div>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                    {toc.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/25 p-5 shadow-elev">
              <div className="text-sm font-bold">Manual Payment</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {itemType.toUpperCase()} • ৳{(item.priceCents / 100).toFixed(0)}
              </div>

              <div className="mt-4 space-y-3 rounded-2xl bg-primary/5 p-4 border border-primary/10">
                <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Payment Instructions</div>
                <p className="text-xs font-medium">Send money to this Personal number:</p>
                <div className="flex items-center gap-2 text-lg font-black text-primary">
                  +8801912895591
                </div>
                <div className="flex gap-2">
                  <span className="rounded bg-pink-500/10 px-1.5 py-0.5 text-[10px] font-bold text-pink-500">Bkash</span>
                  <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-500">Nagad</span>
                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-500">Rocket</span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {!isPurchased && (
                  <div className="space-y-1.5">
                    <label htmlFor="txnId" className="text-[10px] font-bold uppercase tracking-wider opacity-60">Transaction ID</label>
                    <input
                      id="txnId"
                      type="text"
                      placeholder="Enter Txn ID"
                      className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value)}
                    />
                  </div>
                )}

                <Button
                  variant="hero"
                  className="w-full"
                  disabled={isPurchased || isPaying || (!isPurchased && !txnId)}
                  onClick={handleConfirmPurchase}
                >
                  {isPurchased ? "Payment completed" : isPaying ? "Processing…" : "Submit Payment Detail"}
                </Button>

                <Button
                  variant={isPurchased ? "hero" : "outline"}
                  className="w-full"
                  disabled={!isPurchased}
                  onClick={handleDownload}
                >
                  Download
                </Button>

                {!user && (
                  <div className="text-xs text-muted-foreground">
                    You’re not signed in. Sign in first to unlock demo downloads.
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
