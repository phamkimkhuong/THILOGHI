"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "./button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "destructive";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "primary",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const isDestructive = variant === "destructive";

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog.Root open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-in fade-in-0 duration-150" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl animate-in zoom-in-95 duration-150 focus:outline-none">
          <div className="flex items-start gap-4">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isDestructive
                  ? "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/50 dark:border-rose-900"
                  : "bg-blue-50 text-primary border border-blue-100 dark:bg-blue-950/50 dark:border-blue-900"
              }`}
              aria-hidden="true"
            >
              {isDestructive ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <HelpCircle className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <Dialog.Title className="text-base font-bold text-foreground">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </Dialog.Description>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" disabled={loading}>
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              variant={isDestructive ? "destructive" : "primary"}
              size="sm"
              loading={loading}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

