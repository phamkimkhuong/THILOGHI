"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-primary-hover shadow-xs border border-transparent",
      secondary:
        "bg-surface-hover text-foreground hover:bg-[#e4effc] dark:hover:bg-surface-hover/80 border border-border/80",
      outline:
        "border border-border bg-surface text-foreground hover:bg-surface-hover shadow-2xs",
      ghost:
        "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
      destructive:
        "bg-rose-600 text-white hover:bg-rose-700 shadow-xs border border-transparent",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md",
      md: "h-9 px-3.5 text-xs rounded-lg",
      lg: "h-10 px-5 text-sm rounded-lg",
      icon: "h-9 w-9 p-0 rounded-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

