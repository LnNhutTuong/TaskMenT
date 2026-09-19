import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  default: "bg-white text-black hover:bg-white/80",
  outline:
    "border border-white/10 bg-white/[0.03] text-white/70 hover:border-white/35 hover:text-white",
  ghost: "text-white/55 hover:bg-white/[0.05] hover:text-white",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-10 px-4",
  sm: "h-9 px-3",
  icon: "h-9 w-9",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
