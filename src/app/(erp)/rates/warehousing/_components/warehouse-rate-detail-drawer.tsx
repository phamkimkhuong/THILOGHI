"use client";

import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Warehouse,
  Building,
  Calendar,
  Tag,
  Pencil,
  Power,
  Clock,
} from "lucide-react";
import {
  WarehouseRateItem,
  formatCurrency,
  getWarehouseTypeBadge,
  getWarehouseServiceBadge,
  RATE_BASIS_OPTIONS,
} from "./types";

interface WarehouseRateDetailDrawerProps {
  rate: WarehouseRateItem | null;
  onClose: () => void;
  onEdit: (rate: WarehouseRateItem) => void;
  onToggleStatus: (rate: WarehouseRateItem) => void;
}

export function WarehouseRateDetailDrawer({
  rate,
  onClose,
  onEdit,
  onToggleStatus,
}: WarehouseRateDetailDrawerProps) {
  if (!rate) return null;

  const typeBadge = getWarehouseTypeBadge(rate.warehouseType);
  const serviceBadge = getWarehouseServiceBadge(rate.serviceCode);
  const basisObj = RATE_BASIS_OPTIONS.find((b) => b.id === rate.rateBasis);

  return (
    <ResponsiveDrawer
      open={Boolean(rate)}
      onClose={onClose}
      title="Chi tiết Biểu phí Kho bãi & Lưu trữ"
      subtitle={`${rate.serviceName} • ${rate.warehouseName}`}
    >
      <div className="space-y-6 text-sm">
        {/* Khối thẻ tóm tắt giá và trạng thái */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground block">Đơn giá áp dụng</span>
            <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {formatCurrency(rate.unitPrice, rate.currency)}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5 font-mono">
              / {basisObj ? basisObj.unit : rate.rateBasis}
            </span>
          </div>
          <div className="text-right space-y-1">
            <span className="text-xs text-muted-foreground block">Trạng thái</span>
            <StatusBadge status={rate.status} />
          </div>
        </div>

        {/* Thông tin Kho bãi & Đơn vị vận hành */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-primary" />
            <span>Kho bãi & Đơn vị vận hành</span>
          </h4>
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-border/80 bg-background">
            <div>
              <span className="text-xs text-muted-foreground block">Tên Kho Bãi:</span>
              <span className="font-semibold text-foreground text-sm">
                {rate.warehouseName}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Loại Kho Bãi:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border mt-0.5 ${typeBadge.className}`}
              >
                {typeBadge.label}
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-border/60">
              <span className="text-xs text-muted-foreground block">Đơn Vị Vận Hành / NCC:</span>
              <div className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{rate.providerName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin Dịch vụ & Mặt hàng */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span>Dịch vụ Kho & Mặt hàng áp dụng</span>
          </h4>
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-border/80 bg-background">
            <div>
              <span className="text-xs text-muted-foreground block">Nhóm Dịch Vụ:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border mt-0.5 ${serviceBadge.className}`}
              >
                {serviceBadge.label}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Tên Dịch Vụ Chi Tiết:</span>
              <span className="font-semibold text-foreground">
                {rate.serviceName}
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

        {/* Cơ chế tính phí & Thời gian lưu kho */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Cơ chế tính phí & Điều kiện lưu kho</span>
          </h4>
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg border border-border/80 bg-background text-xs">
            <div>
              <span className="text-muted-foreground block">Miễn phí lưu:</span>
              <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                {rate.freeDays > 0 ? `${rate.freeDays} ngày` : "Không"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Tối thiểu tính:</span>
              <span className="font-bold font-mono text-foreground text-sm">
                {rate.minStorageDays} ngày
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Mức cước tối thiểu:</span>
              <span className="font-bold font-mono text-foreground text-sm">
                {rate.minChargeVnd > 0 ? formatCurrency(rate.minChargeVnd) : "0 ₫"}
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
                <span className="text-muted-foreground block mb-0.5">Ghi chú nghiệp vụ:</span>
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
