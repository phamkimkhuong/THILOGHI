"use client";

import { Eye, Pencil, Power, Trash2, Calendar, Shield } from "lucide-react";
import { TableContainer, TableFeedback } from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  InsuranceRateItem,
  formatCurrency,
  getCoverageTypeBadge,
  getTransportModeBadge,
  getPricingModelBadge,
  RATE_BASIS_OPTIONS,
} from "./types";

interface InsuranceRatesTableProps {
  rates: InsuranceRateItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onView: (rate: InsuranceRateItem) => void;
  onEdit: (rate: InsuranceRateItem) => void;
  onToggleStatus: (rate: InsuranceRateItem) => void;
  onDelete: (rate: InsuranceRateItem) => void;
  onResetFilters?: () => void;
  onCreateNew?: () => void;
}

export function InsuranceRatesTable({
  rates,
  loading = false,
  error = null,
  onRetry,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  onResetFilters,
  onCreateNew,
}: InsuranceRatesTableProps) {
  if (!loading && !error && rates.length === 0) {
    return (
      <EmptyState
        title="Chưa có biểu phí Bảo hiểm hàng hóa nào"
        description="Hiện tại hệ thống chưa có dữ liệu biểu phí bảo hiểm hoặc không có bản ghi nào khớp với bộ lọc. Quản trị viên và Chuyên viên Pricing có thể bấm 'Thêm mới biểu phí' để thiết lập định mức phí bảo hiểm đường bộ, đường biển hoặc liên vận."
        action={
          <div className="flex items-center gap-2">
            {onResetFilters && (
              <Button variant="outline" size="sm" onClick={onResetFilters}>
                Xóa bộ lọc
              </Button>
            )}
            {onCreateNew && (
              <Button variant="primary" size="sm" onClick={onCreateNew}>
                Thêm biểu phí đầu tiên
              </Button>
            )}
          </div>
        }
      />
    );
  }

  return (
    <TableContainer ariaLabel="Bảng biểu phí bảo hiểm hàng hóa vận chuyển">
      <table className="erp-table w-full text-left text-xs font-sans">
        <thead>
          <tr>
            <th className="w-12 text-center">STT</th>
            <th className="min-w-[170px]">Đơn Vị Bảo Hiểm</th>
            <th className="min-w-[150px]">Phạm Vi Bảo Hiểm</th>
            <th className="min-w-[130px]">Phương Thức</th>
            <th className="min-w-[140px]">Mặt Hàng Áp Dụng</th>
            <th className="min-w-[110px]">Mô Hình</th>
            <th className="min-w-[100px]">Cơ Sở</th>
            <th className="min-w-[130px] text-right">Mức Phí</th>
            <th className="min-w-[110px] text-right">Mức Khấu Trừ</th>
            <th className="min-w-[140px] text-center">Hiệu Lực</th>
            <th className="w-24 text-center">Trạng Thái</th>
            <th className="w-32 text-center">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading || error ? (
            <TableFeedback
              columns={12}
              loading={loading}
              error={error}
              onRetry={onRetry ?? (() => {})}
            />
          ) : (
            rates.map((item, index) => {
              const coverageBadge = getCoverageTypeBadge(item.coverageType);
              const modeBadge = getTransportModeBadge(item.transportMode);
              const pricingBadge = getPricingModelBadge(item.pricingModel);
              const basisObj = RATE_BASIS_OPTIONS.find((b) => b.id === item.rateBasis);

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

                  {/* Đơn vị bảo hiểm */}
                  <td>
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{item.insurerName}</span>
                    </div>
                  </td>

                  {/* Phạm vi bảo hiểm */}
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${coverageBadge.className}`}
                    >
                      {coverageBadge.label}
                    </span>
                  </td>

                  {/* Phương thức vận tải */}
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${modeBadge.className}`}
                    >
                      {modeBadge.label}
                    </span>
                  </td>

                  {/* Mặt hàng */}
                  <td>
                    <span className="font-medium text-foreground">
                      {item.commodityName}
                    </span>
                  </td>

                  {/* Mô hình */}
                  <td>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${pricingBadge.className}`}
                    >
                      {pricingBadge.label}
                    </span>
                  </td>

                  {/* Cơ sở */}
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-muted-foreground text-[11px] font-mono">
                      {basisObj ? basisObj.unit : item.rateBasis}
                    </span>
                  </td>

                  {/* Mức phí */}
                  <td className="text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                    {item.pricingModel === "PERCENT_OF_VALUE" ? (
                      <div>
                        <div>{item.ratePercent}%</div>
                        {item.minPremiumVnd > 0 && (
                          <div className="text-[10px] text-muted-foreground font-normal">
                            Min: {formatCurrency(item.minPremiumVnd)}
                          </div>
                        )}
                      </div>
                    ) : (
                      formatCurrency(item.unitPrice, item.currency)
                    )}
                  </td>

                  {/* Mức khấu trừ */}
                  <td className="text-right font-mono text-[11px] text-muted-foreground">
                    {item.deductibleVnd > 0 ? (
                      formatCurrency(item.deductibleVnd)
                    ) : (
                      <span className="text-muted-foreground/60">0 VND</span>
                    )}
                  </td>

                  {/* Hiệu lực */}
                  <td className="text-center font-mono text-[11px] text-muted-foreground">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span>
                        {item.validFrom} → {item.validTo}
                      </span>
                    </div>
                  </td>

                  {/* Trạng thái */}
                  <td className="text-center">
                    <StatusBadge status={item.status} />
                  </td>

                  {/* Thao tác */}
                  <td
                    className="text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {/* Xem chi tiết */}
                      <button
                        type="button"
                        onClick={() => onView(item)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Xem chi tiết biểu phí"
                        aria-label={`Xem chi tiết biểu phí ${item.insurerName}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Sửa biểu phí */}
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1 rounded text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        title="Chỉnh sửa biểu phí"
                        aria-label={`Chỉnh sửa biểu phí ${item.insurerName}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Bật/Tắt hiệu lực */}
                      <button
                        type="button"
                        onClick={() => onToggleStatus(item)}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          item.status === "ACTIVE"
                            ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        }`}
                        title={item.status === "ACTIVE" ? "Tạm ngưng biểu phí" : "Kích hoạt lại biểu phí"}
                        aria-label={`Đổi trạng thái biểu phí ${item.insurerName}`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      {/* Xóa */}
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1 rounded text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Xóa biểu phí này"
                        aria-label={`Xóa biểu phí ${item.insurerName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </TableContainer>
  );
}

