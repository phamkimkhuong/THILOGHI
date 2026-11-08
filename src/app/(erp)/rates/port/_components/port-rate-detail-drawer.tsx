"use client";

import { Anchor, Pencil, Power, Calendar, DollarSign, Box, FileText } from "lucide-react";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  PortRateItem,
  formatCurrency,
  getChargeCodeBadge,
  getCargoTypeBadge,
} from "./types";

interface PortRateDetailDrawerProps {
  rate: PortRateItem | null;
  onClose: () => void;
  onEdit: (rate: PortRateItem) => void;
  onToggleStatus: (rate: PortRateItem) => void;
}

export function PortRateDetailDrawer({
  rate,
  onClose,
  onEdit,
  onToggleStatus,
}: PortRateDetailDrawerProps) {
  if (!rate) return null;

  const chargeBadge = getChargeCodeBadge(rate.chargeCode);
  const cargoBadge = getCargoTypeBadge(rate.cargoType);

  const titleNode = (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${chargeBadge.className}`}
      >
        {rate.chargeCode}
      </span>
      <span className="text-foreground">{chargeBadge.label}</span>
    </div>
  );

  const subtitleNode = (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
      <Anchor className="w-3.5 h-3.5 text-blue-600" />
      <span>{rate.portName}</span>
      <span>•</span>
      <span>{rate.serviceCategory}</span>
    </div>
  );

  return (
    <ResponsiveDrawer
      open={Boolean(rate)}
      onClose={onClose}
      title={titleNode}
      subtitle={subtitleNode}
      widthClass="w-full sm:max-w-md md:max-w-lg"
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs font-sans">
        {/* Block: Đơn giá và quy đổi */}
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-blue-600" /> Đơn giá biểu phí gốc:
            </span>
            <span className="font-mono text-lg font-bold text-foreground">
              {formatCurrency(rate.unitPrice, rate.currency)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
            <span className="text-muted-foreground">Đơn vị tính:</span>
            <span className="font-bold text-foreground bg-surface px-2 py-0.5 rounded border border-border">
              {rate.unit}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-muted-foreground">Đơn giá quy đổi (VND):</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(rate.unitPriceVnd, "VND")}
            </span>
          </div>
        </div>

        {/* Thông tin quy cách & Cont */}
        <div className="space-y-3">
          <h3 className="font-bold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-primary" /> Thông số kỹ thuật &amp; Hàng hóa
          </h3>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-background border border-border">
            <div>
              <span className="text-muted-foreground block mb-1">Loại Container:</span>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted border border-border">
                {rate.containerType}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Loại hàng:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cargoBadge.className}`}
              >
                {cargoBadge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Trạng thái & Hiệu lực */}
        <div className="space-y-3">
          <h3 className="font-bold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" /> Trạng thái &amp; Thời hạn
          </h3>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-background border border-border">
            <div>
              <span className="text-muted-foreground block mb-1">Trạng thái:</span>
              <StatusBadge status={rate.status} />
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Hiệu lực:</span>
              <div className="font-mono text-xs text-foreground">
                {rate.validFrom} → {rate.validTo}
              </div>
            </div>
          </div>
        </div>

        {/* Ghi chú nghiệp vụ */}
        <div className="space-y-2">
          <h3 className="font-bold text-foreground uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary" /> Ghi chú &amp; Điều kiện áp dụng
          </h3>
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-foreground leading-relaxed">
            {rate.notes || "Không có ghi chú thêm."}
          </div>
        </div>

        {/* Thông tin hệ thống */}
        <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Mã định danh (Rate ID):</span>
            <span className="font-mono">{rate.rateId}</span>
          </div>
          <div className="flex justify-between">
            <span>Mã cảng:</span>
            <span className="font-mono font-semibold">{rate.portCode}</span>
          </div>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-border bg-surface flex items-center justify-between gap-2 shrink-0">
        <Button
          variant={rate.status === "ACTIVE" ? "outline" : "primary"}
          size="sm"
          className="text-xs"
          onClick={() => onToggleStatus(rate)}
        >
          <Power className="w-3.5 h-3.5 mr-1.5" />
          {rate.status === "ACTIVE" ? "Tạm ngưng" : "Kích hoạt hiệu lực"}
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Đóng
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="text-xs"
            onClick={() => onEdit(rate)}
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Chỉnh sửa
          </Button>
        </div>
      </div>
    </ResponsiveDrawer>
  );
}
