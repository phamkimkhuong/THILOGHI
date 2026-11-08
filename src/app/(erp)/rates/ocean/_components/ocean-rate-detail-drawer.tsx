"use client";

import { Ship, Pencil, Power, Calendar, DollarSign, Package, Anchor, ArrowRight } from "lucide-react";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  OceanRateItem,
  formatCurrency,
  formatUsd,
  getContainerTypeBadge,
} from "./types";
import { OCEAN_FX_RATE_USD_VND } from "@/server/modules/supplier-pricing/ocean-rates.service";

interface OceanRateDetailDrawerProps {
  rate: OceanRateItem | null;
  onClose: () => void;
  onEdit: (rate: OceanRateItem) => void;
  onToggleStatus: (rate: OceanRateItem) => void;
}

export function OceanRateDetailDrawer({
  rate,
  onClose,
  onEdit,
  onToggleStatus,
}: OceanRateDetailDrawerProps) {
  if (!rate) return null;

  const contBadge = getContainerTypeBadge(rate.containerType);
  const totalLocalCharges =
    rate.thcFee +
    rate.docsFee +
    rate.sealFee +
    rate.afsFee +
    rate.telexFee +
    rate.bafCafFee +
    rate.otherSurcharges;

  const oceanFreightVnd = rate.oceanFreightUsd * (OCEAN_FX_RATE_USD_VND || 25700);

  const titleNode = (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${contBadge.className}`}
      >
        {contBadge.label}
      </span>
      <span className="text-foreground">{rate.carrierName}</span>
    </div>
  );

  const subtitleNode = (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
      <Ship className="w-3.5 h-3.5 text-blue-600" />
      <span>Hãng: {rate.carrierId}</span>
      <span>•</span>
      <span>{rate.polName} &rarr; {rate.podName}</span>
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
        {/* Block: Tổng chi phí và bóc tách */}
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1 font-medium">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Tổng chi phí mua quy đổi:
            </span>
            <span className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(rate.totalChargesVnd)}
            </span>
          </div>

          <div className="pt-2 border-t border-blue-200/50 dark:border-blue-800/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-700 dark:text-blue-400">1. Cước biển (O/F USD):</span>
              <div className="text-right">
                <span className="font-mono font-bold text-blue-600 text-sm">
                  {formatUsd(rate.oceanFreightUsd)}
                </span>
                <span className="block text-[10px] text-muted-foreground font-mono">
                  &asymp; {formatCurrency(oceanFreightVnd)} (tỷ giá 25.700)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-dashed border-border">
              <span>2. Phí chứng từ (Docs fee):</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(rate.docsFee)}
              </span>
            </div>

            <div className="flex items-center justify-between text-muted-foreground">
              <span>3. Phí niêm chì (Seal fee):</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(rate.sealFee)}
              </span>
            </div>

            <div className="flex items-center justify-between text-muted-foreground">
              <span>4. Phí truyền dữ liệu (AFS fee):</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(rate.afsFee)}
              </span>
            </div>

            <div className="flex items-center justify-between text-muted-foreground">
              <span>5. Phí điện giao hàng (Telex release):</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(rate.telexFee)}
              </span>
            </div>

            {rate.thcFee > 0 && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>6. Phí xếp dỡ bến bãi (THC):</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(rate.thcFee)}
                </span>
              </div>
            )}

            {rate.bafCafFee > 0 && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>7. Phụ phí xăng dầu &amp; tỷ giá (BAF/CAF):</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(rate.bafCafFee)}
                </span>
              </div>
            )}

            {rate.otherSurcharges > 0 && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>8. Phụ phí khác:</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(rate.otherSurcharges)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border font-medium">
              <span>Tổng phụ phí Local Charges:</span>
              <span className="font-mono font-bold text-foreground">
                {formatCurrency(totalLocalCharges)}
              </span>
            </div>
          </div>
        </div>

        {/* Thông tin Tuyến vận tải & Cảng biển */}
        <div className="space-y-3">
          <h3 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Anchor className="w-3.5 h-3.5 text-primary" /> Tuyến Vận Tải Đường Biển
          </h3>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-background border border-border">
            <div>
              <span className="text-muted-foreground block mb-1">Cảng đi (POL):</span>
              <div className="font-bold text-blue-700 dark:text-blue-400">{rate.polName}</div>
              <div className="font-mono text-[11px] text-muted-foreground mt-0.5">Mã: {rate.polId}</div>
            </div>

            <div>
              <span className="text-muted-foreground block mb-1">Cảng đến (POD):</span>
              <div className="font-bold text-emerald-700 dark:text-emerald-400">{rate.podName}</div>
              <div className="font-mono text-[11px] text-muted-foreground mt-0.5">Mã: {rate.podId}</div>
            </div>

            <div className="col-span-2 pt-2 border-t border-border flex items-center gap-2">
              <span className="text-muted-foreground">Lộ trình:</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                {rate.polName} <ArrowRight className="w-3 h-3 text-muted-foreground" /> {rate.podName}
              </span>
            </div>
          </div>
        </div>

        {/* Thông tin Hàng hóa & Container */}
        <div className="space-y-3">
          <h3 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-primary" /> Mặt Hàng &amp; Loại Container
          </h3>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-background border border-border">
            <div>
              <span className="text-muted-foreground block mb-1">Loại Container:</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${contBadge.className}`}
              >
                {contBadge.label}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block mb-1">Mặt hàng áp dụng:</span>
              <span className="font-bold text-foreground">{rate.commodityName}</span>
            </div>

            <div>
              <span className="text-muted-foreground block mb-1">Hãng tàu vận chuyển:</span>
              <span className="font-bold text-foreground">{rate.carrierName} ({rate.carrierId})</span>
            </div>

            <div>
              <span className="text-muted-foreground block mb-1">Đồng tiền cơ sở:</span>
              <span className="font-bold font-mono text-foreground">{rate.currency}</span>
            </div>
          </div>
        </div>

        {/* Hiệu lực & Trạng thái */}
        <div className="space-y-3">
          <h3 className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" /> Thời Gian Áp Dụng &amp; Trạng Thái
          </h3>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-background border border-border">
            <div>
              <span className="text-muted-foreground block mb-1">Trạng thái:</span>
              <StatusBadge status={rate.status} />
            </div>

            <div>
              <span className="text-muted-foreground block mb-1">Thời hạn hiệu lực:</span>
              <div className="font-mono font-medium text-foreground">
                {rate.validFrom} &rarr; {rate.validTo}
              </div>
            </div>

            {rate.notes && (
              <div className="col-span-2 pt-2 border-t border-border">
                <span className="text-muted-foreground block mb-1">Ghi chú nghiệp vụ:</span>
                <p className="text-foreground italic">{rate.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(rate)}
            className="text-xs"
          >
            <Power className="w-3.5 h-3.5 mr-1" />
            {rate.status === "ACTIVE" ? "Ngừng áp dụng" : "Kích hoạt lại"}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              onClose();
              onEdit(rate);
            }}
            className="text-xs"
          >
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Chỉnh sửa biểu cước
          </Button>
        </div>
      </div>
    </ResponsiveDrawer>
  );
}

