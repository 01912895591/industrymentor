import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export type DemoCatalogItem = {
  key: string;
  title: string;
  description: string;
  priceCents: number;
  image_url?: string;
};

export const demoEbooks: DemoCatalogItem[] = [
  {
    key: "ebook-sizing-basics",
    title: "E‑Book: Garment Sizing & Fit Basics",
    description: "A practical guide to measurement points, tolerances, and fit checks.",
    priceCents: 199,
    image_url: "/ebook-sizing.webp"
  },
  {
    key: "ebook-production-planning",
    title: "E‑Book: Production Planning Playbook",
    description: "Line planning, capacity, bottlenecks, and daily production control.",
    priceCents: 299,
    image_url: "/ebook-planning.webp"
  },
  {
    key: "ebook-quality-audit",
    title: "E‑Book: Quality Audit Checklist",
    description: "A ready-to-use audit checklist for inline and final inspection.",
    priceCents: 149,
    image_url: "/ebook-quality.webp"
  },
];

export const demoSops: DemoCatalogItem[] = [
  {
    key: "sop-inline-inspection",
    title: "SOP: Inline Inspection",
    description: "Step-by-step SOP for inline inspection workflow and defect logging.",
    priceCents: 199,
  },
  {
    key: "sop-cutting-room",
    title: "SOP: Cutting Room Controls",
    description: "Marker approval, fabric relaxation, cut panel bundling, and tracking.",
    priceCents: 249,
  },
  {
    key: "sop-packing-final",
    title: "SOP: Final Packing & Shipment",
    description: "Carton planning, labeling, metal detection, and shipment handover.",
    priceCents: 179,
  },
];

export async function ensurePurchased(params: {
  userId: string;
  itemType: "ebook" | "sop";
  item: DemoCatalogItem;
  transactionId?: string;
}) {
  const { userId, itemType, item, transactionId } = params;

  const { error } = await (supabase as any).from("purchases").insert({
    user_id: userId,
    item_type: itemType,
    item_key: item.key,
    title: transactionId ? `${item.title} (Txn: ${transactionId})` : item.title,
    amount_cents: item.priceCents,
  });

  if (error) {
    // ignore unique violation (already purchased)
    if (String(error.code) === "23505") return;
    toast({ title: "Submission failed", description: error.message, variant: "destructive" });
  }
}
