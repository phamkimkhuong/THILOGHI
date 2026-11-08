"use client";

import { Eye, Pencil, Power, Trash2, Calendar, ShieldCheck } from "lucide-react";
import { TableContainer } from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  BorderRateItem,
  formatCurrency,
  getCountryPairBadge,
} from "./types";

interface BorderRatesTableProps {
  rates: BorderRateItem[];
  loading?: boolean;
  onView: (rate: BorderRateItem) => void;
  onEdit: (rate: BorderRateItem) => void;
  onToggleStatus: (rate: BorderRateItem) => void;
  onDelete: (rate: BorderRateItem) => void;
  onResetFilters?: () => void;
}

export function BorderRatesTable({
  rates,
  loading = false,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  onResetFilters,
}: BorderRatesTableProps) {
  if (!loading && rates.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy biểu phí cửa khẩu nào"
        description="Không có bản ghi biểu phí cửa khẩu & bãi kiểm hóa nào khớp với tiêu chí tìm kiếm hoặc phân loại đã chọn."
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
    <TableContainer ariaLabel="Bảng biểu phí Cửa khẩu & Bãi kiểm hóa liên vận">
      <table className="erp-table w-full text-left text-xs font-sans">
        <thead>
          <tr>
            <th className="w-12 text-center">STT</th>
            <th className="min-w-[130px]">Tuyến Quốc Gia</th>
            <th className="min-w-[180px]">Cặp Cửa Khẩu</th>
            <th className="min-w-[150px]">Cặp Tỉnh Thành</th>
            <th className="min-w-[140px]">Mặt Hàng</th>
            <th className="min-w-[100px] text-right">Phí CSHT</th>
            <th className="min-w-[100px] text-right">Phí Vào Bãi</th>
            <th className="min-w-[110px] text-right">Phí Tờ Khai</th>
            <th className="min-w-[125px] text-right">Tổng Phí (VND)</th>
            <th className="min-w-[140px] text-center">Hiệu Lực</th>
            <th className="w-24 text-center">Trạng Thái</th>
            <th className="w-32 text-center">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rates.map((item, index) => {
            const countryBadge = getCountryPairBadge(item.countryPair);

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

                {/* Tuyến Quốc gia */}
                <td>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${countryBadge.className}`}
                  >
                    {countryBadge.label}
                  </span>
                </td>

                {/* Cặp Cửa khẩu */}
                <td>
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground text-xs group-hover:text-primary transition-colors flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{item.borderPairName}</span>
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      Mã: {item.borderPairId}
                    </div>
                  </div>
                </td>

                {/* Cặp Tỉnh Thành */}
                <td>
                  <span className="text-muted-foreground font-medium">
                    {item.provinces || "—"}
                  </span>
                </td>

                {/* Mặt Hàng */}
                <td>
                  <span className="font-medium text-foreground bg-surface px-1.5 py-0.5 rounded border border-border">
                    {item.commodityName}
                  </span>
                </td>

                {/* Phí CSHT */}
                <td className="text-right font-mono text-muted-foreground">
                  {formatCurrency(item.infrastructureFee, item.currency)}
                </td>

                {/* Phí Vào Bãi */}
                <td className="text-right font-mono text-muted-foreground">
                  {formatCurrency(item.entryExitFee, item.currency)}
                </td>

                {/* Phí Tờ Khai */}
                <td className="text-right font-mono text-muted-foreground">
                  {formatCurrency(item.customsFee, item.currency)}
                </td>

                {/* Tổng Chi Phí (VND) */}
                <td className="text-right">
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                    {formatCurrency(item.totalFee, item.currency)}
                  </div>
                </td>

                {/* Hiệu Lực */}
                <td className="text-center">
                  <div className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>
                      {item.validFrom} → {item.validTo}
                    </span>
                  </div>
                </td>

                {/* Trạng Thái */}
                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                  <StatusBadge status={item.status} />
                </td>

                {/* Thao Tác */}
                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      aria-label="Xem chi tiết biểu phí"
                      onClick={() => onView(item)}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Chỉnh sửa biểu phí"
                      onClick={() => onEdit(item)}
                      className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={
                        item.status === "ACTIVE"
                          ? "Tạm dừng áp dụng"
                          : "Kích hoạt áp dụng"
                      }
                      onClick={() => onToggleStatus(item)}
                      className={`p-1.5 rounded transition-colors ${
                        item.status === "ACTIVE"
                          ? "text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      }`}
                      title={
                        item.status === "ACTIVE"
                          ? "Tạm dừng áp dụng"
                          : "Kích hoạt áp dụng"
                      }
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Xóa biểu phí này"
                      onClick={() => onDelete(item)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Xóa biểu phí"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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

