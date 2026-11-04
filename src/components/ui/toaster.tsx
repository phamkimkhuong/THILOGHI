"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "bg-surface text-foreground border border-border shadow-lg font-sans text-sm rounded-xl p-4 gap-3",
          description: "text-muted-foreground text-xs",
          actionButton: "bg-primary text-primary-foreground text-xs font-medium rounded-lg px-3 py-1.5 hover:bg-primary-hover transition-colors",
          cancelButton: "bg-surface-hover text-muted-foreground text-xs font-medium rounded-lg px-3 py-1.5",
          error: "!border-rose-200 !bg-rose-50 !text-rose-900 dark:!bg-rose-950/80 dark:!border-rose-800 dark:!text-rose-200",
          success: "!border-emerald-200 !bg-emerald-50 !text-emerald-900 dark:!bg-emerald-950/80 dark:!border-emerald-800 dark:!text-emerald-200",
          warning: "!border-amber-200 !bg-amber-50 !text-amber-900 dark:!bg-amber-950/80 dark:!border-amber-800 dark:!text-amber-200",
          info: "!border-blue-200 !bg-blue-50 !text-blue-900 dark:!bg-blue-950/80 dark:!border-blue-800 dark:!text-blue-200",
        },
      }}
    />
  );
}

