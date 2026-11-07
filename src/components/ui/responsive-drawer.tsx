"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ResponsiveDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  widthClass?: string;
}

/**
 * Slide-over Drawer Archetype chuẩn THILOGI ERP:
 * - Mobile (< 768px): Chiếm 100% màn hình (w-full).
 * - Tablet: Tối đa sm:max-w-md.
 * - Laptop / Desktop: max-w-lg (512px).
 */
export function ResponsiveDrawer({
  open,
  onClose,
  title,
  subtitle,
  actions,
  children,
  className = "",
  widthClass = "w-full sm:max-w-md md:max-w-lg",
}: ResponsiveDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`${widthClass} bg-surface border-l border-border h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300 ${className}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Drawer */}
        {(title || actions) && (
          <div className="p-4 border-b border-border flex items-start justify-between bg-surface-hover shrink-0">
            <div className="space-y-1 pr-3">
              {title && (
                <div className="text-base font-bold text-foreground leading-snug">
                  {title}
                </div>
              )}
              {subtitle && (
                <div className="text-xs text-muted-foreground">{subtitle}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng ngăn chi tiết"
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Nội dung Drawer có thanh cuộn riêng */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-foreground scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}

