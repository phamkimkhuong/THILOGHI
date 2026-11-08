"use client";

import { Eye, Pencil, Power, Trash2, Calendar, FileText } from "lucide-react";
import { TableContainer, TableFeedback } from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  OtherRateItem,
  formatCurrency,
  getServiceCodeBadge,
  getPricingMethodBadge,
  RATE_BASIS_OPTIONS,
} from "./types";

interface OtherRatesTableProps {
  rates: OtherRateItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onView: (rate: OtherRateItem) => void;
  onEdit: (rate: OtherRateItem) => void;
  onToggleStatus: (rate: OtherRateItem) => void;
  onDelete: (rate: OtherRateItem) => void;
  onResetFilters?: () => void;
  onCreateNew?: () => void;
}

export function OtherRatesTable({
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
}: OtherRatesTableProps) {
  if (!loading && !error && rates.length === 0) {
    return (
      <EmptyState
        title="Chưa có biểu phí Dịch vụ khác nào"
        description="Hiện tại hệ thống chưa có dữ liệu biểu phí dịch vụ khác hoặc không có bản ghi nào khớp với bộ lọc. Quản trị viên và Chuyên viên Pricing có thể bấm 'Thêm mới biểu phí' để thiết lập định mức cho các dịch vụ khảo sát giám định, xe hộ tống, chuyển giao chứng từ hoặc thiết bị chuyên dụng."
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
    <TableContainer ariaLabel="Bảng biểu phí dịch vụ khác có kiểm soát">
      <table className="erp-table w-full text-left text-xs font-sans">
        <thead>
          <tr>
            <th className="w-12 text-center">STT</th>
            <th className="min-w-[150px]">Mã Dịch Vụ Chuẩn</th>
            <th className="min-w-[200px]">Tên Dịch Vụ Chi Tiết</th>
            <th className="min-w-[160px]">Đơn Vị Cung Cấp</th>
            <th className="min-w-[120px]">Phương Pháp</th>
            <th className="min-w-[110px]">Cơ Sở Tính</th>
            <th className="min-w-[120px] text-right">Đơn Giá</th>
            <th className="min-w-[110px] text-center">Chứng Từ</th>
            <th className="min-w-[140px] text-center">Hiệu Lực</th>
            <th className="w-24 text-center">Trạng Thái</th>
            <th className="w-32 text-center">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading || error ? (
            <TableFeedback
              columns={11}
              loading={loading}
              error={error}
              onRetry={onRetry ?? (() => {})}
            />
          ) : (
            rates.map((item, index) => {
              const codeBadge = getServiceCodeBadge(item.serviceCode);
              const pricingBadge = getPricingMethodBadge(item.pricingMethod);
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

                  {/* Mã dịch vụ chuẩn */}
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${codeBadge.className}`}
                    >
                      {codeBadge.label}
                    </span>
                  </td>

                  {/* Tên dịch vụ chi tiết */}
                  <td>
                    <div className="font-semibold text-foreground">
                      {item.serviceName}
                    </div>
                  </td>

                  {/* Đơn vị cung cấp */}
                  <td>
                    <div className="font-medium text-foreground">
                      {item.providerName}
                    </div>
                  </td>

                  {/* Phương pháp định giá */}
                  <td>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${pricingBadge.className}`}
                    >
                      {pricingBadge.label}
                    </span>
                  </td>

                  {/* Cơ sở tính */}
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-muted-foreground text-[11px] font-mono">
                      {basisObj ? basisObj.unit : item.rateBasis}
                    </span>
                  </td>

                  {/* Đơn giá */}
                  <td className="text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                    {item.pricingMethod === "ACTUAL" ? (
                      <span className="text-orange-600 dark:text-orange-400 text-[11px]">
                        Theo hóa đơn
                      </span>
                    ) : (
                      formatCurrency(item.unitPrice, item.currency)
                    )}
                  </td>

                  {/* Yêu cầu chứng từ */}
                  <td className="text-center text-[11px]">
                    {item.evidenceRequired ? (
                      <span className="inline-flex items-center gap-1 text-orange-700 dark:text-orange-300 font-semibold px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900">
                        <FileText className="w-3 h-3" />
                        <span>Bắt buộc</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
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
                        aria-label={`Xem chi tiết biểu phí ${item.serviceName}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Sửa biểu phí */}
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1 rounded text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        title="Chỉnh sửa biểu phí"
                        aria-label={`Chỉnh sửa biểu phí ${item.serviceName}`}
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
                        aria-label={`Đổi trạng thái biểu phí ${item.serviceName}`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      {/* Xóa */}
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1 rounded text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Xóa biểu phí này"
                        aria-label={`Xóa biểu phí ${item.serviceName}`}
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
