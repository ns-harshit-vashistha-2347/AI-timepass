"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-prompt to-prompt-soft text-[#0b0616] hover:brightness-110 disabled:from-prompt/30 disabled:to-prompt-soft/30 disabled:text-[#0b0616]/50 shadow-glow",
  secondary:
    "bg-chrome hover:bg-chrome-hover text-ink border border-chrome-border hover:border-prompt/40",
  ghost:
    "text-ink-muted hover:bg-chrome-hover hover:text-ink",
  danger:
    "bg-danger/90 hover:bg-danger text-[#1a0808] font-semibold",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[11.5px]",
  md: "h-9 px-4 text-xs",
  lg: "h-11 px-5 text-[13px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-mono font-semibold tracking-[0.08em] transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-prompt/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "disabled:cursor-not-allowed disabled:opacity-70",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
