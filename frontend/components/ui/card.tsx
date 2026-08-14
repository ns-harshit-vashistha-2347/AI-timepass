import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-surface-border bg-surface/60 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";
