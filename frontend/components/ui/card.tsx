import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md border border-chrome-border bg-bg-soft/70 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";
