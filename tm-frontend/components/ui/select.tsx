import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 rounded-lg border border-white/10 bg-black px-3 text-xs text-white/70 outline-none transition-colors focus:border-white/40 focus:ring-2 focus:ring-white/10",
        className,
      )}
      {...props}
    />
  );
}
