import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/15 text-primary hover:bg-primary/25",
        secondary: "border-border/60 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-destructive/25 bg-destructive/15 text-destructive hover:bg-destructive/25",
        outline: "border-border text-foreground",
        success: "border-emerald-500/25 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25",
        warning: "border-amber-500/25 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25",
        info: "border-blue-500/25 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25",
        pill: "rounded-full border-border/60 bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
