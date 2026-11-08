"use client";

import { Eye, Pencil, Power, Trash2, Calendar, Ship, ArrowRight } from "lucide-react";
import { TableContainer } from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  OceanRateItem,
  formatCurrency,
  formatUsd,
  getContainerTypeBadge,
} from "./types";

interface OceanRatesTableProps {
  rates: OceanRateItem[];
  loading?: boolean;
  onView: (rate: OceanRateItem) => void;
  onEdit: (rate: OceanRateItem) => void;
  onToggleStatus: (rate: OceanRateItem) => void;
  onDelete: (rate: OceanRateItem) => void;
  onResetFilters?: () => void;
}

export function OceanRatesTable({
  rates,
  loading = false,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  onResetFilters,
}: OceanRatesTableProps) {
  if (!loading && rates.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy biểu cước vận tải biển nào"
        description="Không có bản ghi biểu cước vận tải biển nào khớp với hãng tàu, tuyến cảng hoặc loại container đã chọn."
        action={
          onResetFilters ? (
            <Button variant="outline" size="sm" onClick={onResetFilters}>
              Xóa bộ lọc
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <TableContainer ariaLabel="Bảng biểu cước Vận tải biển quốc tế & feeder">
      <table className="erp-table w-full text-left text-xs font-sans">
        <thead>
          <tr>
            <th className="w-12 text-center">STT</th>
            <th className="min-w-[150px]">Hãng Tàu</th>
            <th className="min-w-[210px]">Tuyến Vận Tải (POL &rarr; POD)</th>
            <th className="min-w-[130px]">Loại Cont</th>
            <th className="min-w-[140px]">Mặt Hàng</th>
            <th className="min-w-[120px] text-right">Cước Biển (O/F)</th>
            <th className="min-w-[150px] text-right">Local Charges</th>
            <th className="min-w-[140px] text-right">Tổng Quy Đổi (VND)</th>
            <th className="min-w-[140px] text-center">Hiệu Lực</th>
            <th className="w-24 text-center">Trạng Thái</th>
            <th className="w-32 text-center">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rates.map((item, index) => {
            const contBadge = getContainerTypeBadge(item.containerType);
            const totalLocalCharges =
              item.thcFee +
              item.docsFee +
              item.sealFee +
              item.afsFee +
              item.telexFee +
              item.bafCafFee +
              item.otherSurcharges;

            return (
              <tr
                key={item.rateId}
                className="hover:bg-muted/40 transition-colors group cursor-pointer"
                onClick={() => onView(item)}
              >
                {/* STT */}
                <td className="text-center font-mono text-muted-foreground">
                  {index + 1}
                </td>

                {/* Hãng Tàu */}
                <td>
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground text-xs group-hover:text-primary transition-colors flex items-center gap-1.5">
                      <Ship className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{item.carrierId}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[160px]" title={item.carrierName}>
                      {item.carrierName}
                    </div>
                  </div>
                </td>

                {/* Tuyến Vận Tải (POL -> POD) */}
                <td>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                      <span className="text-blue-700 dark:text-blue-400">{item.polName}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-emerald-700 dark:text-emerald-400">{item.podName}</span>
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {item.polId} &rarr; {item.podId}
                    </div>
                  </div>
                </td>

                {/* Loại Cont */}
                <td>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${contBadge.className}`}
                  >
                    {contBadge.label}
                  </span>
                </td>

                {/* Mặt Hàng */}
                <td>
                  <span className="font-medium text-foreground bg-surface px-1.5 py-0.5 rounded border border-border">
                    {item.commodityName}
                  </span>
                </td>

                {/* Cước Biển USD */}
                <td className="text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                  {formatUsd(item.oceanFreightUsd)}
                </td>

                {/* Local charges */}
                <td className="text-right font-mono text-muted-foreground">
                  <div title={`Docs: ${formatCurrency(item.docsFee)}, Seal: ${formatCurrency(item.sealFee)}, AFS: ${formatCurrency(item.afsFee)}, Telex: ${formatCurrency(item.telexFee)}`}>
                    {formatCurrency(totalLocalCharges)}
                  </div>
                </td>

                {/* Tổng chi phí VND */}
                <td className="text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                  {formatCurrency(item.totalChargesVnd)}
                </td>

                {/* Hiệu Lực */}
                <td className="text-center font-mono text-[11px] text-muted-foreground">
                  <div className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {item.validFrom} &rarr; {item.validTo}
                    </span>
                  </div>
                </td>

                {/* Trạng Thái */}
                <td className="text-center">
                  <StatusBadge status={item.status} />
                </td>

                {/* Thao Tác */}
                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      aria-label="Xem chi tiết biểu cước"
                      onClick={() => onView(item)}
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Chỉnh sửa biểu cước"
                      onClick={() => onEdit(item)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={item.status === "ACTIVE" ? "Tạm ngưng biểu cước" : "Kích hoạt biểu cước"}
                      onClick={() => onToggleStatus(item)}
                      className={`p-1 rounded transition-colors ${
                        item.status === "ACTIVE"
                          ? "text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950"
                          : "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      }`}
                      title={item.status === "ACTIVE" ? "Chuyển sang Ngừng áp dụng" : "Kích hoạt lại"}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Xóa biểu cước"
                      onClick={() => onDelete(item)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                      title="Xóa biểu cước"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableContainer>
  );
}

