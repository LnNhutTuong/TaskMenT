import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#080808] shadow-[0_18px_48px_rgb(0_0_0_/_28%)]",
        className,
      )}
      {...props}
    />
  );
}
