"use client";

import {
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
} from "lucide-react";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
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

  const formatPrice = (price: number, curr = "VND") => {
    return new Intl.NumberFormat("vi-VN").format(price) + ` ${curr}`;
  };

  return (
    <ResponsiveDrawer
      open={Boolean(rate)}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-blue-600/10 text-blue-600 border border-blue-200 dark:border-blue-800">
            <Receipt className="w-4 h-4" />
          </span>
          <span>{rate.pickupName} &rarr; {rate.deliveryName}</span>
        </div>
      }
      subtitle={
        <span className="flex items-center gap-2 mt-1">
          <span className="font-mono text-xs font-semibold text-foreground bg-surface px-2 py-0.5 rounded border border-border">
            {rate.equipmentType}
          </span>
          <StatusBadge status={rate.status} />
          <span className="text-muted-foreground text-xs">• {rate.vendorName}</span>
        </span>
      }
    >
      <div className="space-y-5 text-xs font-sans pb-4">
        {/* Card Đơn giá mua nổi bật */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20">
          <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 block mb-1">
            Đơn giá mua đầu vào (Chưa VAT)
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            {formatPrice(rate.buyRate, rate.currency)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Áp dụng cho cấu hình thiết bị <strong>{rate.equipmentType}</strong> nguyên chuyến.
          </p>
        </div>

        {/* Khối Tuyến đường vận chuyển */}
        <div className="p-3.5 rounded-xl border border-border bg-surface space-y-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <Truck className="w-4 h-4 text-blue-600" /> Tuyến đường vận tải
          </h4>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="text-[11px] text-muted-foreground block">Điểm xếp hàng (Origin)</span>
                <span className="font-semibold text-foreground text-xs">{rate.pickupName}</span>
                <span className="font-mono text-[10px] text-muted-foreground ml-1.5">({rate.pickupCode})</span>
              </div>
            </div>

            <div className="ml-3 pl-3 border-l border-dashed border-border py-1 text-muted-foreground text-[10px]">
              &darr; Tuyến đường bộ tiêu chuẩn
            </div>

            <div className="flex items-start gap-2.5">
              <span className="p-1.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="text-[11px] text-muted-foreground block">Điểm dỡ hàng (Destination)</span>
                <span className="font-semibold text-foreground text-xs">{rate.deliveryName}</span>
                <span className="font-mono text-[10px] text-muted-foreground ml-1.5">({rate.deliveryCode})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Khối Thông tin Đối tác & Thời hạn hiệu lực */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-border bg-surface space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Nhà cung cấp
            </span>
            <p className="font-semibold text-foreground text-xs">{rate.vendorName}</p>
            <p className="font-mono text-[10px] text-muted-foreground">ID: {rate.vendorId}</p>
          </div>

          <div className="p-3 rounded-xl border border-border bg-surface space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Thời hạn hiệu lực
            </span>
            <p className="font-mono text-xs text-foreground font-medium">
              {rate.validFrom || "—"} &rarr; {rate.validTo || "—"}
            </p>
            <span className="inline-block mt-0.5">
              <StatusBadge status={rate.status} />
            </span>
          </div>
        </div>

        {/* Khối Ghi chú / Điều khoản phụ */}
        {rate.remarks && (
          <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1.5">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Ghi chú &amp; Điều khoản
            </span>
            <p className="text-xs text-foreground leading-relaxed italic bg-surface-hover p-2.5 rounded-lg border border-border">
              &ldquo;{rate.remarks}&rdquo;
            </p>
          </div>
        )}

        {/* Thao tác Quản trị biểu cước */}
        <div className="p-3.5 border-t border-border bg-surface-hover/50 rounded-xl space-y-2 mt-4">
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
    </ResponsiveDrawer>
  );
}
