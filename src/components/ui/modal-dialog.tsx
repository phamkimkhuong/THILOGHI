"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export type ModalDialogSize = "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

export const MODAL_SIZE_CLASSES: Record<ModalDialogSize, string> = {
  md: "sm:max-w-md",                                                    // 448px (Popup xác nhận / cảnh báo nhỏ)
  lg: "sm:max-w-xl",                                                    // 576px (Hộp thoại chọn lựa / tải file)
  xl: "sm:max-w-2xl md:max-w-3xl",                                      // 768px (Form vừa phải)
  "2xl": "sm:max-w-3xl md:max-w-4xl lg:max-w-5xl",                     // 1024px (MẶC ĐỊNH: Form Tạo mới / Chỉnh sửa ERP rộng rãi)
  "3xl": "sm:max-w-4xl md:max-w-5xl lg:max-w-6xl",                     // 1152px (Form có bảng phụ / nhiều tab)
  full: "sm:max-w-[95vw] md:max-w-[92vw] lg:max-w-[88vw] xl:max-w-[1500px]", // Khung rộng tối đa theo canvas
};

export const MODAL_CONTENT_BASE_CLASS =
  "fixed left-1/2 top-1/2 z-50 w-[95vw] -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface p-4 sm:p-6 text-foreground shadow-2xl animate-in zoom-in-95 duration-150 focus:outline-none font-sans scrollbar-thin";

export interface ModalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  size?: ModalDialogSize;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Component Modal Dialog chuẩn hóa toàn hệ thống THILOGI ERP.
 * Mặc định kích thước "2xl" (1024px trên Desktop, co giãn mượt mà 95vw trên Mobile/Tablet),
 * đảm bảo mọi form Tạo mới và Chỉnh sửa đều có không gian thoáng rộng, dễ quan sát và nhập liệu.
 */
export function ModalDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  size = "2xl",
  children,
  className,
  contentClassName,
}: ModalDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs animate-in fade-in-0 duration-150" />
        <Dialog.Content
          className={cn(
            MODAL_CONTENT_BASE_CLASS,
            MODAL_SIZE_CLASSES[size],
            className
          )}
        >
          {/* Header Dialog Chuẩn Hóa */}
          <div className="flex items-start justify-between border-b border-border pb-3.5 mb-4 shrink-0">
            <div className="flex items-start gap-3 min-w-0 pr-4">
              {Icon && (
                <span className="p-2 rounded-xl bg-blue-600/10 text-blue-600 border border-blue-200 dark:border-blue-800 shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </span>
              )}
              <div className="min-w-0 space-y-0.5">
                <Dialog.Title className="text-base sm:text-lg font-bold text-foreground">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="text-xs text-muted-foreground leading-relaxed">
                    {description}
                  </Dialog.Description>
                )}
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-transparent hover:border-border transition-colors cursor-pointer shrink-0"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Thân Dialog (Nội dung Form) */}
          <div className={cn("min-w-0", contentClassName)}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

