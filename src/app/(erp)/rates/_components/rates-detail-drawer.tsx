"use client";

import {
  X,
  Receipt,
  Building2,
  MapPin,
  Calendar,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  FileText,
  Truck,
  DollarSign,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import type { RoadRateItem } from "./types";

interface RatesDetailDrawerProps {
  rate: RoadRateItem | null;
  onClose: () => void;
  onEdit: (rate: RoadRateItem) => void;
  onToggle: (rate: RoadRateItem) => void;
  onDelete: (rate: RoadRateItem) => void;
}

export function RatesDetailDrawer({
  rate,
  onClose,
  onEdit,
  onToggle,
  onDelete,
}: RatesDetailDrawerProps) {
  if (!rate) return null;

  const isApproved = rate.status === "APPROVED" || rate.status === "Active";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200 font-sans">
      <div
        className="w-full sm:max-w-md md:max-w-lg bg-surface border-l border-border h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rate-drawer-title"
      >
        {/* Header Drawer */}
        <div className="p-4 border-b border-border flex items-start justify-between bg-surface-hover shrink-0">
          <div className="space-y-1 pr-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600 border border-blue-200 dark:border-blue-800">
                <Receipt className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs font-semibold text-foreground bg-surface px-2 py-0.5 rounded border border-border">
                {rate.equipmentType}
              </span>
              <StatusBadge status={rate.status} />
            </div>
            <h2 id="rate-drawer-title" className="text-base font-bold text-foreground leading-snug">
              {rate.pickupName} &rarr; {rate.deliveryName}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Nhà cung cấp:{" "}
              <strong className="text-foreground">{rate.vendorName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer"
            aria-label="Đóng ngăn chi tiết"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung chi tiết Drawer */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-foreground scrollbar-thin">
          {/* Card 1: Tuyến vận chuyển */}
          <div className="p-3.5 rounded-xl bg-background border border-border space-y-3">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider block">
              Thông tin Tuyến vận tải
            </span>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-muted-foreground block">Điểm xếp hàng (Origin):</span>
                  <p className="font-semibold text-foreground text-xs">{rate.pickupName}</p>
                  <span className="text-[11px] font-mono text-muted-foreground">{rate.pickupCode}</span>
                </div>
              </div>
              <div className="border-l-2 border-dashed border-border ml-2 pl-4 py-1" />
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] text-muted-foreground block">Điểm dỡ hàng (Destination):</span>
                  <p className="font-semibold text-foreground text-xs">{rate.deliveryName}</p>
                  <span className="text-[11px] font-mono text-muted-foreground">{rate.deliveryCode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Thiết bị & Đơn giá mua */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-muted-foreground text-[11px] block">Thiết bị / Cont</span>
              <div className="mt-1 font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>{rate.equipmentType}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-muted-foreground text-[11px] block">Đơn giá mua đầu vào</span>
              <div className="mt-1 font-bold text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-1 font-mono">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>
                  {new Intl.NumberFormat("vi-VN", {
                    maximumFractionDigits: rate.currency === "VND" ? 0 : 2,
                  }).format(rate.buyRate)}{" "}
                  {rate.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Hiệu lực thời gian */}
          <div className="p-3.5 rounded-xl bg-background border border-border space-y-2">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider block">
              Thời hạn hiệu lực cước
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Từ ngày:</span>
                <strong className="font-mono text-foreground">{rate.validFrom || "Không giới hạn"}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Đến ngày:</span>
                <strong className="font-mono text-foreground">{rate.validTo || "Không thời hạn"}</strong>
              </div>
            </div>
          </div>

          {/* Card 4: Nhà cung cấp & Mã định danh */}
          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Mã định danh cước:</span>
              <strong className="font-mono text-foreground">{rate.rateId}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Mã nhà cung cấp:</span>
              <strong className="font-mono text-foreground">{rate.vendorId}</strong>
            </div>
          </div>

          {/* Card 5: Ghi chú điều kiện cước */}
          {rate.remarks && (
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-1.5">
              <span className="text-muted-foreground text-[11px] flex items-center gap-1 font-medium">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Ghi chú & Điều kiện cước:
              </span>
              <p className="text-foreground text-xs leading-relaxed bg-surface p-2.5 rounded-lg border border-border">
                {rate.remarks}
              </p>
            </div>
          )}
        </div>

        {/* Footer Drawer: Thao tác Quản trị */}
        <div className="p-4 border-t border-border bg-surface-hover space-y-2 shrink-0">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Thao tác Quản trị biểu cước
          </span>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onEdit(rate)}
              className="flex items-center justify-center gap-1 text-xs"
            >
              <Pencil className="w-3.5 h-3.5" /> Sửa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggle(rate)}
              className="flex items-center justify-center gap-1 text-xs"
            >
              {isApproved ? (
                <>
                  <PowerOff className="w-3.5 h-3.5 text-amber-600" /> Tạm ngưng
                </>
              ) : (
                <>
                  <Power className="w-3.5 h-3.5 text-emerald-600" /> Kích hoạt
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(rate)}
              className="flex items-center justify-center gap-1 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

