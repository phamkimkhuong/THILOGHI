"use client";

import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Calendar,
  Tag,
  Pencil,
  Power,
  AlertCircle,
} from "lucide-react";
import {
  InsuranceRateItem,
  formatCurrency,
  getCoverageTypeBadge,
  getTransportModeBadge,
  getPricingModelBadge,
  RATE_BASIS_OPTIONS,
} from "./types";

interface InsuranceRateDetailDrawerProps {
  rate: InsuranceRateItem | null;
  onClose: () => void;
  onEdit: (rate: InsuranceRateItem) => void;
  onToggleStatus: (rate: InsuranceRateItem) => void;
}

export function InsuranceRateDetailDrawer({
  rate,
  onClose,
  onEdit,
  onToggleStatus,
}: InsuranceRateDetailDrawerProps) {
  if (!rate) return null;

  const coverageBadge = getCoverageTypeBadge(rate.coverageType);
  const modeBadge = getTransportModeBadge(rate.transportMode);
  const pricingBadge = getPricingModelBadge(rate.pricingModel);
  const basisObj = RATE_BASIS_OPTIONS.find((b) => b.id === rate.rateBasis);

  return (
    <ResponsiveDrawer
      open={Boolean(rate)}
      onClose={onClose}
      title="Chi tiết Biểu phí Bảo hiểm Hàng hóa"
      subtitle={`${rate.insurerName} • ${coverageBadge.label}`}
    >
      <div className="space-y-6 text-sm">
        {/* Khối thẻ tóm tắt giá và trạng thái */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground block">Mức phí áp dụng</span>
            {rate.pricingModel === "PERCENT_OF_VALUE" ? (
              <div>
                <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {rate.ratePercent}%
                </span>
                <span className="text-xs text-muted-foreground ml-1.5 font-mono">
                  giá trị hàng hóa (Invoice Value)
                </span>
                {rate.minPremiumVnd > 0 && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Phí tối thiểu: <span className="font-bold text-foreground">{formatCurrency(rate.minPremiumVnd)}</span>
                  </div>
                )}
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

        {/* Thông tin Đơn vị bảo hiểm & Phạm vi */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>Đơn vị bảo hiểm & Phạm vi áp dụng</span>
          </h4>
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-border/80 bg-background">
            <div className="col-span-2">
              <span className="text-xs text-muted-foreground block">Công Ty Bảo Hiểm Đối Tác:</span>
              <span className="font-semibold text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {rate.insurerName}
              </span>
            </div>
            <div className="pt-2 border-t border-border/60">
              <span className="text-xs text-muted-foreground block">Phạm Vi Bảo Hiểm:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border mt-0.5 ${coverageBadge.className}`}
              >
                {coverageBadge.label}
              </span>
            </div>
            <div className="pt-2 border-t border-border/60">
              <span className="text-xs text-muted-foreground block">Phương Thức Vận Tải:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border mt-0.5 ${modeBadge.className}`}
              >
                {modeBadge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Mặt hàng & Cơ chế tính */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span>Mặt hàng & Cơ chế tính phí</span>
          </h4>
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-border/80 bg-background">
            <div>
              <span className="text-xs text-muted-foreground block">Mô Hình Tính Phí:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border mt-0.5 ${pricingBadge.className}`}
              >
                {pricingBadge.label}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Cơ Sở Tính Phí:</span>
              <span className="font-semibold text-foreground font-mono mt-0.5 block">
                {basisObj ? basisObj.label : rate.rateBasis}
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-border/60">
              <span className="text-xs text-muted-foreground block">Mặt Hàng Áp Dụng:</span>
              <span className="font-bold text-foreground text-sm text-blue-600 dark:text-blue-400">
                {rate.commodityName}
              </span>
            </div>
          </div>
        </div>

        {/* Khấu trừ & Giới hạn bồi thường */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-primary" />
            <span>Mức khấu trừ & Giới hạn trách nhiệm</span>
          </h4>
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-border/80 bg-background text-xs">
            <div>
              <span className="text-muted-foreground block">Mức khấu trừ tổn thất (Deductible):</span>
              <span className="font-bold font-mono text-foreground text-sm">
                {rate.deductibleVnd > 0 ? formatCurrency(rate.deductibleVnd) : "0 VND (Không khấu trừ)"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Giới hạn trách nhiệm tối đa:</span>
              <span className="font-bold font-mono text-foreground text-sm">
                {rate.maxInsuredValueVnd ? formatCurrency(rate.maxInsuredValueVnd) : "Không giới hạn"}
              </span>
            </div>
          </div>
        </div>

        {/* Thời hạn hiệu lực */}
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
                <span className="text-muted-foreground block mb-0.5">Ghi chú điều khoản:</span>
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