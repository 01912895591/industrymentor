import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, ClipboardList, ArrowRight, ChevronRight, Folder } from "lucide-react";
import type { DemoCatalogItem } from "@/features/library/demoCatalog";
import { LibraryItemDialog } from "@/features/library/LibraryItemDialog";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

type Category = "ebooks" | "sops";

type LibraryItem = {
  id: string;
  item_type: "ebook" | "sop";
  item_key: string;
  title: string;
  description: string;
  price_cents: number;
  industry?: string | null;
  category?: string | null;
  image_url?: string | null;
};

export function ResourceLibrarySection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [active, setActive] = useState<Category>("ebooks");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation state for SOPs
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [selected, setSelected] = useState<
    | {
      itemType: "ebook" | "sop";
      item: DemoCatalogItem;
    }
    | undefined
  >(undefined);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("library_items")
        .select("*")
        .eq("published", true);

      if (data) {
        setItems(data.map(d => ({
          ...d,
          price_cents: d.price_cents ?? 0,
          description: d.description || ""
        })) as LibraryItem[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Auto-open logic when returning from auth
  useEffect(() => {
    if (loading || !user || items.length === 0) return;

    const buyKey = searchParams.get("buy_key");
    if (buyKey) {
      const it = items.find((i) => i.item_key === buyKey);
      if (it) {
        setSelected({
          itemType: it.item_type,
          item: {
            key: it.item_key,
            title: it.title,
            description: it.description,
            priceCents: it.price_cents,
            image_url: it.image_url || undefined,
          },
        });
        // Clear the param so it doesn't re-open on refresh
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("buy_key");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [loading, user, items, searchParams, setSearchParams]);

  const filteredItems = useMemo(() => {
    if (active === "ebooks") {
      return items.filter(i => i.item_type === "ebook");
    }

    // SOPs Logic
    let sops = items.filter(i => i.item_type === "sop");
    if (selectedIndustry) {
      sops = sops.filter(i => i.industry === selectedIndustry);
    }
    if (selectedCategory) {
      sops = sops.filter(i => i.category === selectedCategory);
    }
    return sops;
  }, [active, items, selectedIndustry, selectedCategory]);

  // Extract unique industries from SOPs
  const industries = useMemo(() => {
    const sops = items.filter(i => i.item_type === "sop");
    return Array.from(new Set(sops.map(i => i.industry).filter(Boolean))) as string[];
  }, [items]);

  // Extract unique categories for selected industry
  const categories = useMemo(() => {
    if (!selectedIndustry) return [];
    const sops = items.filter(i => i.item_type === "sop" && i.industry === selectedIndustry);
    return Array.from(new Set(sops.map(i => i.category).filter(Boolean))) as string[];
  }, [items, selectedIndustry]);

  const resetSopNav = () => {
    setSelectedIndustry(null);
    setSelectedCategory(null);
  };

  return (
    <section id="library" className="scroll-mt-24 py-20 lg:py-24 border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Resource <span className="text-primary">Library</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            E-books and SOPs — curated resources for garment industry professionals.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:mt-10 sm:flex-row sm:gap-3">
          <Button
            variant={active === "ebooks" ? "hero" : "soft"}
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => { setActive("ebooks"); resetSopNav(); }}
          >
            <BookOpen className="h-4 w-4" />
            E‑Books Gallery
          </Button>
          <Button
            variant={active === "sops" ? "hero" : "soft"}
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => setActive("sops")}
          >
            <ClipboardList className="h-4 w-4" />
            SOPs Hub
          </Button>
        </div>

        {/* SOP Navigation Breadcrumbs */}
        {active === "sops" && (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <button onClick={resetSopNav} className="hover:text-primary hover:underline">SOPs Hub</button>
            {selectedIndustry && (
              <>
                <ChevronRight className="h-4 w-4" />
                <button onClick={() => setSelectedCategory(null)} className="hover:text-primary hover:underline">{selectedIndustry}</button>
              </>
            )}
            {selectedCategory && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="font-semibold text-foreground">{selectedCategory}</span>
              </>
            )}
          </div>
        )}

        <div className="mt-10">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading resources...</div>
          ) : active === "sops" && !selectedIndustry ? (
            // Industry Selection View
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {industries.length > 0 ? industries.map(ind => (
                <button
                  key={ind}
                  onClick={() => setSelectedIndustry(ind)}
                  className="group flex flex-col items-center justify-center rounded-xl border border-border/70 bg-card/40 p-6 sm:p-8 text-center shadow-sm transition-all hover:border-border-active hover:bg-card/60"
                  type="button"
                >
                  <div className="mb-4 rounded-md bg-primary/10 p-3 sm:p-4 text-primary group-hover:bg-primary/20">
                    <Folder className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold">{ind} Industry</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Browse SOPs for {ind}</p>
                </button>
              )) : (
                <div className="col-span-full text-center text-muted-foreground">No industries found. Please add SOPs with Industry tags in Admin.</div>
              )}
            </div>
          ) : active === "sops" && selectedIndustry && !selectedCategory ? (
            // Department Selection View
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.length > 0 ? categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="group flex flex-col items-center justify-center rounded-xl border border-border/70 bg-card/40 p-6 sm:p-8 text-center shadow-sm transition-all hover:border-border-active hover:bg-card/60"
                  type="button"
                >
                  <div className="mb-4 rounded-md bg-primary/10 p-3 sm:p-4 text-primary group-hover:bg-primary/20">
                    <Folder className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold">{cat} Dept</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Browse SOPs for {cat}</p>
                </button>
              )) : (
                <div className="col-span-full text-center text-muted-foreground">No departments found for {selectedIndustry}.</div>
              )}
            </div>
          ) : (
            // Items List View (E-books or Leaf SOPs)
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((it) => (
                <div
                  key={it.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card/50 shadow-sm transition-all duration-200 hover:border-border-active hover:shadow-md hover:-translate-y-0.5"
                >
                  {/* Item Image / Cover */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted/20">
                    {(() => {
                      const fallbackCovers = [
                        "/ebook-sizing.png",
                        "/ebook-planning.png",
                        "/ebook-quality.png"
                      ];
                      // Use hash of title to consistently pick a fallback
                      const hash = it.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      const imageUrl = it.image_url || fallbackCovers[hash % fallbackCovers.length];

                      return (
                        <img
                          src={imageUrl}
                          alt={it.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      );
                    })()}
                    <div className="absolute right-4 top-4 rounded-full bg-background/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm text-primary">
                      {it.item_type}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex-1">
                      <div className="text-base sm:text-lg font-bold tracking-tight leading-snug">{it.title}</div>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {it.description}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      <div className="text-base font-bold font-mono text-foreground sm:text-lg tabular-nums">
                        ৳{(it.price_cents / 100).toFixed(0)}
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-lg px-5 font-semibold text-xs h-8"
                        onClick={() => {
                          if (!user) {
                            navigate(`/auth?mode=login&buy_key=${it.item_key}`);
                            return;
                          }
                          setSelected({
                            itemType: it.item_type,
                            item: {
                              key: it.item_key,
                              title: it.title,
                              description: it.description,
                              priceCents: it.price_cents,
                              image_url: it.image_url || undefined
                            }
                          });
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  No items found in this category.
                </div>
              )}
            </div>
          )}
        </div>

        {selected && (
          <LibraryItemDialog
            open={!!selected}
            onOpenChange={(open) => {
              if (!open) setSelected(undefined);
            }}
            itemType={selected.itemType}
            item={selected.item}
          />
        )}

        <div className="mt-12 flex justify-center">
          <Button variant="soft" size="lg" asChild>
            <Link to="/library">
              View All Resources
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
