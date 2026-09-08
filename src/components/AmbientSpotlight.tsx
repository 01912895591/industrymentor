import React, { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Signature moment: a subtle spotlight that follows the pointer.
 * - GPU-friendly (only updates CSS vars)
 * - Respects reduced motion
 */
export function AmbientSpotlight({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
    [],
  );

  useEffect(() => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;

    let frameId: number;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty("--spot-x", `${x}px`);
        el.style.setProperty("--spot-y", `${y}px`);
      });
    };

    el.addEventListener("pointermove", onMove);
    return () => {
      el.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frameId);
    };
  }, [reduceMotion]);

  return (
    <div ref={ref} className={cn("spotlight-surface", className)}>
      {children}
    </div>
  );
}
