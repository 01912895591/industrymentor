import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectCardSkeleton() {
  return (
    <Card className="flex flex-col h-full bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden shadow-sm">
      <CardContent className="p-6 flex flex-col flex-1 space-y-4">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-4/5 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </div>

        {/* Career Path / Domain */}
        <div className="pt-2">
          <Skeleton className="h-5 w-32 rounded-md" />
        </div>

        {/* Skills Chips */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>

        {/* Footer & CTA */}
        <div className="pt-4 mt-auto border-t border-border/40 flex items-center justify-between">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
