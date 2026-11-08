"use client";

import {
  X,
  Layers,
  Pencil,
  Power,
  Tag,
  Calculator,
  FileText,
  Boxes,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  MasterServicePackage,
  getCategoryBadge,
  getPricingTypeBadge,
} from "./types";

interface ServicesDetailDrawerProps {
  service: MasterServicePackage | null;
  onClose: () => void;
  onEdit: (service: MasterServicePackage) => void;
  onToggleStatus: (service: MasterServicePackage) => void;
}

export function ServicesDetailDrawer({
  service,
  onClose,
  onEdit,
  onToggleStatus,
}: ServicesDetailDrawerProps) {
  if (!service) return null;

  const catBadge = getCategoryBadge(service.serviceCategory);
  const pricingBadge = getPricingTypeBadge(service.pricingType);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200 font-sans">
      <div
        className="w-full sm:max-w-md md:max-w-lg bg-surface border-l border-border h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header Drawer */}
        <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between bg-muted/20">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-primary border border-blue-200 dark:border-blue-900 shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted border border-border">
                  {service.serviceId}
                </span>
                {service.isCoreTransport && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Vận tải chính (Core)
                  </span>
                )}
              </div>
              <h2
                id="drawer-title"
                className="text-base font-bold text-foreground mt-1"
              >
                {service.serviceName}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            aria-label="Đóng ngăn kéo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
          {/* Trạng thái & Phân loại */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-background border border-border">
            <div>
              <span className="text-muted-foreground block mb-1">Trạng thái:</span>
              <StatusBadge status={service.isActive ? "ACTIVE" : "INACTIVE"} />
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Phân nhóm:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${catBadge.className}`}
              >
                {catBadge.label}
              </span>
            </div>
          </div>

          {/* Phương thức tính cước & Đơn vị tính */}
          <div className="space-y-2">
            <h3 className="font-bold text-foreground text-xs flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
              <Calculator className="w-3.5 h-3.5 text-primary" />
              <span>Quy cách thương mại &amp; Tính cước</span>
            </h3>
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-3">
              <div>
                <span className="text-muted-foreground block mb-1">Phương thức tính giá:</span>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${pricingBadge.className}`}
                >
                  {pricingBadge.label}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {pricingBadge.desc}
                </p>
              </div>
              <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                <span className="text-muted-foreground">Đơn vị tính mặc định:</span>
                <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                  {service.defaultUnit}
                </span>
              </div>
            </div>
          </div>

          {/* Mô tả nghiệp vụ & Phạm vi */}
          <div className="space-y-2">
            <h3 className="font-bold text-foreground text-xs flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Mô tả &amp; Phạm vi nghiệp vụ</span>
            </h3>
            <div className="p-3.5 rounded-xl bg-background border border-border text-foreground leading-relaxed whitespace-pre-wrap">
              {service.description || "Chưa có mô tả chi tiết."}
            </div>
          </div>

          {/* Các chi phí cấu thành điển hình (Typical Charges) */}
          {service.typicalCharges && service.typicalCharges.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-foreground text-xs flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                <Boxes className="w-3.5 h-3.5 text-primary" />
                <span>Các chi phí thành phần (Charges &amp; Surcharges)</span>
              </h3>
              <div className="p-3 rounded-xl bg-background border border-border flex flex-wrap gap-1.5">
                {service.typicalCharges.map((chg) => (
                  <span
                    key={chg}
                    className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-1 rounded-md bg-muted text-foreground border border-border"
                  >
                    <Tag className="w-3 h-3 text-primary" />
                    <span>{chg}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(service)}
            className={
              service.isActive
                ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            }
          >
            <Power className="w-3.5 h-3.5 mr-1.5" />
            <span>{service.isActive ? "Tạm dừng" : "Kích hoạt"}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(service);
              }}
              className="flex items-center gap-1.5 shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Chỉnh sửa</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

