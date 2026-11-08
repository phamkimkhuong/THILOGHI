"use client";

import { ShieldCheck, Pencil, Power, Calendar, DollarSign, Package, MapPin, FileText } from "lucide-react";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  BorderRateItem,
  formatCurrency,
  getCountryPairBadge,
} from "./types";

interface BorderRateDetailDrawerProps {
  rate: BorderRateItem | null;
  onClose: () => void;
  onEdit: (rate: BorderRateItem) => void;
  onToggleStatus: (rate: BorderRateItem) => void;
}

export function BorderRateDetailDrawer({
  rate,
  onClose,
  onEdit,
  onToggleStatus,
}: BorderRateDetailDrawerProps) {
  if (!rate) return null;

  const countryBadge = getCountryPairBadge(rate.countryPair);

  const titleNode = (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${countryBadge.className}`}
      >
        {countryBadge.label}
      </span>
      <span className="text-foreground">{rate.borderPairName}</span>
    </div>
  );

  const subtitleNode = (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
      <span>Mã: {rate.borderPairId}</span>
      <span>•</span>
      <span>{rate.provinces || "Liên vận"}</span>
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
        {/* Block: Tổng chi phí và bóc tách các loại phí */}
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1 font-medium">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Tổng chi phí qua cửa khẩu:
            </span>
            <span className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(rate.totalFee, rate.currency)}
            </span>
          </div>

          <div className="pt-2 border-t border-blue-200/50 dark:border-blue-800/50 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>1. Phí sử dụng hạ tầng (CSHT):</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(rate.infrastructureFee, rate.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>2. Phí ra vào bãi kiểm hóa:</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(rate.entryExitFee, rate.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>3. Lệ phí tờ khai hải quan:</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(rate.customsFee, rate.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Thông tin Cửa khẩu & Địa lý */}
        <div className="space-y-3">
          <h3 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" /> Thông tin Cửa khẩu &amp; Tuyến
          </h3>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-background border border-border">
            <div>
              <span className="text-muted-foreground block mb-1">Mã cặp cửa khẩu:</span>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted border border-border">
                {rate.borderPairId}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Tên cặp cửa khẩu:</span>
              <span className="font-semibold text-foreground">{rate.borderPairName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Tuyến quốc gia:</span>
              <span className="font-medium text-foreground">{rate.countryPair}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Cặp tỉnh thành giáp biên:</span>
              <span className="font-medium text-foreground">{rate.provinces || "—"}</span>
            </div>
          </div>
        </div>

        {/* Thông tin Hàng hóa & Hiệu lực */}
        <div className="space-y-3">
          <h3 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-primary" /> Mặt hàng &amp; Thời hạn áp dụng
          </h3>

          <div className="p-3.5 rounded-xl bg-background border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Mặt hàng quy định:</span>
              <span className="font-bold text-foreground bg-surface px-2 py-0.5 rounded border border-border">
                {rate.commodityName}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Thời hạn hiệu lực:
              </span>
              <span className="font-mono text-muted-foreground">
                {rate.validFrom} → {rate.validTo}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <span className="text-muted-foreground">Trạng thái áp dụng:</span>
              <StatusBadge status={rate.status} />
            </div>
          </div>
        </div>

        {/* Ghi chú nghiệp vụ */}
        {rate.notes && (
          <div className="space-y-1.5">
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" /> Ghi chú &amp; Lưu ý cửa khẩu
            </h3>
            <div className="p-3 rounded-lg bg-muted/40 border border-border text-foreground leading-relaxed italic">
              {rate.notes}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Actions Footer */}
      <div className="p-4 border-t border-border bg-surface flex items-center justify-between gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleStatus(rate)}
          className="flex items-center gap-1.5"
        >
          <Power className="w-3.5 h-3.5" />
          <span>{rate.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"}</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Đóng
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onEdit(rate)}
            className="flex items-center gap-1.5 font-semibold"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Chỉnh sửa</span>
          </Button>
        </div>
      </div>
    </ResponsiveDrawer>
  );
}

