"use client";

import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  FileCheck,
  Building,
  Calendar,
  Tag,
  Pencil,
  Power,
} from "lucide-react";
import {
  CustomsRateItem,
  formatCurrency,
  getProcedureBadge,
  getServiceCodeBadge,
  RATE_BASIS_OPTIONS,
} from "./types";

interface CustomsRateDetailDrawerProps {
  rate: CustomsRateItem | null;
  onClose: () => void;
  onEdit: (rate: CustomsRateItem) => void;
  onToggleStatus: (rate: CustomsRateItem) => void;
}

export function CustomsRateDetailDrawer({
  rate,
  onClose,
  onEdit,
  onToggleStatus,
}: CustomsRateDetailDrawerProps) {
  if (!rate) return null;

  const procBadge = getProcedureBadge(rate.customsProcedure);
  const serviceBadge = getServiceCodeBadge(rate.serviceCode);
  const basisObj = RATE_BASIS_OPTIONS.find((b) => b.id === rate.rateBasis);

  return (
    <ResponsiveDrawer
      open={Boolean(rate)}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          <span>Chi tiết Biểu phí Hải quan</span>
        </div>
      }
      subtitle={`Mã biểu phí: ${rate.rateId}`}
      widthClass="w-full sm:max-w-md md:max-w-lg"
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-sans">
        {/* Card Tóm tắt Đơn giá & Loại hình */}
        <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border ${procBadge.className}`}
            >
              {procBadge.label}
            </span>
            <StatusBadge status={rate.status} />
          </div>

          <div className="pt-2">
            <span className="text-muted-foreground block text-[11px]">Đơn giá dịch vụ:</span>
            <div className="font-mono text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              {formatCurrency(rate.unitPrice, rate.currency)}
              <span className="text-xs font-normal text-muted-foreground ml-2">
                / {basisObj?.unit || rate.rateBasis}
              </span>
            </div>
          </div>
        </div>

        {/* Khối Chi cục & Địa điểm làm thủ tục */}
        <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2.5">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Building className="w-4 h-4 text-blue-600" />
            Chi Cục &amp; Địa Điểm Làm Thủ Tục
          </h4>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-muted-foreground block text-[11px]">Chi cục Hải quan:</span>
              <span className="font-semibold text-foreground">{rate.customsOfficeName}</span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                Mã: {rate.customsOfficeId}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Quốc gia áp dụng:</span>
              <span className="font-semibold text-foreground font-mono">{rate.countryCode}</span>
            </div>

            <div className="col-span-2">
              <span className="text-muted-foreground block text-[11px]">Đại lý / Đơn vị cung cấp:</span>
              <span className="font-semibold text-foreground">{rate.providerName}</span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                Mã đối tác: {rate.providerId}
              </span>
            </div>
          </div>
        </div>

        {/* Khối Thông tin dịch vụ & Mặt hàng */}
        <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2.5">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-blue-600" />
            Dịch Vụ &amp; Mặt Hàng Áp Dụng
          </h4>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-muted-foreground block text-[11px]">Tên dịch vụ:</span>
              <span className="font-semibold text-foreground">{rate.serviceName}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Nhóm tác nghiệp:</span>
              <span className={serviceBadge.className}>{serviceBadge.label}</span>
            </div>

            <div className="col-span-2">
              <span className="text-muted-foreground block text-[11px]">Mặt hàng áp dụng:</span>
              <span className="font-semibold text-foreground">{rate.commodityName}</span>
              <span className="text-[10px] text-muted-foreground block">
                * Dữ liệu đối chiếu từ Danh mục Hàng hóa
              </span>
            </div>

            <div className="col-span-2">
              <span className="text-muted-foreground block text-[11px]">Cơ sở tính giá:</span>
              <span className="font-mono text-foreground font-semibold">
                {basisObj?.label || rate.rateBasis}
              </span>
            </div>
          </div>
        </div>

        {/* Khối Thời hạn hiệu lực & Ghi chú */}
        <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2.5">
          <h4 className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            Thời Hạn Hiệu Lực &amp; Ghi Chú
          </h4>

          <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
            <div>
              <span className="text-muted-foreground block text-[11px] font-sans">Hiệu lực từ ngày:</span>
              <span className="text-foreground">{rate.validFrom || "---"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] font-sans">Hiệu lực đến ngày:</span>
              <span className="text-foreground">{rate.validTo || "---"}</span>
            </div>
          </div>

          {rate.notes && (
            <div className="pt-1 border-t border-border/60">
              <span className="text-muted-foreground block text-[11px]">Ghi chú nghiệp vụ:</span>
              <p className="text-foreground italic">{rate.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawer Actions Footer */}
      <div className="p-4 border-t border-border bg-surface flex items-center justify-between gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleStatus(rate)}
          className="flex items-center gap-1.5"
        >
          <Power className="w-3.5 h-3.5 text-amber-600" />
          <span>{rate.status === "ACTIVE" ? "Tạm ngưng áp dụng" : "Kích hoạt lại"}</span>
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
            onClick={() => {
              onClose();
              onEdit(rate);
            }}
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

