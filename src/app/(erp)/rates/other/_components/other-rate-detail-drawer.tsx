"use client";

import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Building,
  Calendar,
  Tag,
  Pencil,
  Power,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  OtherRateItem,
  formatCurrency,
  getServiceCodeBadge,
  getPricingMethodBadge,
  RATE_BASIS_OPTIONS,
  OTHER_SERVICE_CODE_OPTIONS,
} from "./types";

interface OtherRateDetailDrawerProps {
  rate: OtherRateItem | null;
  onClose: () => void;
  onEdit: (rate: OtherRateItem) => void;
  onToggleStatus: (rate: OtherRateItem) => void;
}

export function OtherRateDetailDrawer({
  rate,
  onClose,
  onEdit,
  onToggleStatus,
}: OtherRateDetailDrawerProps) {
  if (!rate) return null;

  const codeBadge = getServiceCodeBadge(rate.serviceCode);
  const pricingBadge = getPricingMethodBadge(rate.pricingMethod);
  const basisObj = RATE_BASIS_OPTIONS.find((b) => b.id === rate.rateBasis);
  const codeObj = OTHER_SERVICE_CODE_OPTIONS.find((c) => c.id === rate.serviceCode);

  return (
    <ResponsiveDrawer
      open={Boolean(rate)}
      onClose={onClose}
      title="Chi tiết Biểu phí Dịch vụ Khác có kiểm soát"
      subtitle={`${rate.serviceName} • ${codeBadge.label}`}
    >
      <div className="space-y-6 text-sm">
        {/* Khối thẻ tóm tắt giá và trạng thái */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground block">Đơn giá định mức</span>
            {rate.pricingMethod === "ACTUAL" ? (
              <div>
                <span className="text-2xl font-bold font-mono text-orange-600 dark:text-orange-400">
                  Thu chi thực tế
                </span>
                <span className="text-xs text-muted-foreground ml-1.5 font-mono">
                  (Kèm hóa đơn/biên lai)
                </span>
              </div>
            ) : (
              <div>
                <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(rate.unitPrice, rate.currency)}
                </span>
                <span className="text-xs text-muted-foreground ml-1.5 font-mono">
                  / {basisObj ? basisObj.unit : rate.rateBasis}
                </span>
              </div>
            )}
          </div>
          <div className="text-right space-y-1">
            <span className="text-xs text-muted-foreground block">Trạng thái</span>
            <StatusBadge status={rate.status} />
          </div>
        </div>

        {/* Thông tin Mã dịch vụ chuẩn & Đơn vị thực hiện */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span>Phân loại nghiệp vụ & Đơn vị thực hiện</span>
          </h4>
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-border/80 bg-background">
            <div>
              <span className="text-xs text-muted-foreground block">Mã Dịch Vụ Chuẩn:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border mt-0.5 ${codeBadge.className}`}
              >
                {codeBadge.label}
              </span>
              {codeObj?.desc && (
                <p className="text-[11px] text-muted-foreground mt-1 italic">
                  {codeObj.desc}
                </p>
              )}
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Phương Pháp Định Giá:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border mt-0.5 ${pricingBadge.className}`}
              >
                {pricingBadge.label}
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-border/60">
              <span className="text-xs text-muted-foreground block">Đơn Vị Thực Hiện / NCC:</span>
              <div className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{rate.providerName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chi tiết dịch vụ & Yêu cầu chứng từ */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>Chi tiết nghiệp vụ & Yêu cầu chứng từ (Evidence)</span>
          </h4>
          <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground block">Tên Dịch Vụ:</span>
              <span className="font-bold text-foreground text-sm">
                {rate.serviceName}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-muted-foreground">Cơ sở tính cước:</span>
              <span className="font-mono font-semibold text-foreground">
                {basisObj ? basisObj.label : rate.rateBasis}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Yêu cầu chứng từ thực tế:</span>
              {rate.evidenceRequired ? (
                <span className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Bắt buộc có biên lai/hóa đơn</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Không bắt buộc</span>
              )}
            </div>
          </div>
        </div>

        {/* Thời hạn hiệu lực & Ghi chú */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Thời hạn hiệu lực & Ghi chú</span>
          </h4>
          <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Hiệu lực từ ngày:</span>
              <span className="font-mono font-semibold text-foreground">
                {rate.validFrom}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Đến hết ngày:</span>
              <span className="font-mono font-semibold text-foreground">
                {rate.validTo}
              </span>
            </div>
            {rate.notes && (
              <div className="pt-2 border-t border-border/60 text-xs">
                <span className="text-muted-foreground block mb-0.5">Ghi chú điều kiện thực hiện:</span>
                <p className="text-foreground italic bg-muted/30 p-2 rounded">
                  {rate.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Thanh tác vụ dưới cùng */}
        <div className="pt-4 border-t border-border flex items-center gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(rate)}
            className="flex items-center gap-1.5"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{rate.status === "ACTIVE" ? "Tạm ngưng" : "Kích hoạt lại"}</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(rate);
            }}
            className="flex items-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Chỉnh sửa biểu phí</span>
          </Button>
        </div>
      </div>
    </ResponsiveDrawer>
  );
}