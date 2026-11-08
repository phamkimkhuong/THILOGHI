"use client";

import { Eye, Pencil, Power, Trash2, Calendar } from "lucide-react";
import { TableContainer, TableFeedback } from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  CustomsRateItem,
  formatCurrency,
  getProcedureBadge,
  getServiceCodeBadge,
  RATE_BASIS_OPTIONS,
} from "./types";

interface CustomsRatesTableProps {
  rates: CustomsRateItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onView: (rate: CustomsRateItem) => void;
  onEdit: (rate: CustomsRateItem) => void;
  onToggleStatus: (rate: CustomsRateItem) => void;
  onDelete: (rate: CustomsRateItem) => void;
  onResetFilters?: () => void;
  onCreateNew?: () => void;
}

export function CustomsRatesTable({
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
}: CustomsRatesTableProps) {
  if (!loading && !error && rates.length === 0) {
    return (
      <EmptyState
        title="Chưa có biểu phí dịch vụ Hải quan nào"
        description="Hiện tại hệ thống chưa có dữ liệu biểu phí Hải quan hoặc không có bản ghi nào khớp với tiêu chí tìm kiếm. Quản trị viên và Chuyên viên Pricing có thể bấm 'Thêm mới biểu phí' để thiết lập bảng giá dịch vụ."
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
    <TableContainer ariaLabel="Bảng biểu phí dịch vụ Hải quan và thủ tục thông quan">
      <table className="erp-table w-full text-left text-xs font-sans">
        <thead>
          <tr>
            <th className="w-12 text-center">STT</th>
            <th className="min-w-[140px]">Loại Hình Tờ Khai</th>
            <th className="min-w-[180px]">Chi Cục / Địa Điểm</th>
            <th className="min-w-[160px]">Đại Lý / Nhà Cung Cấp</th>
            <th className="min-w-[160px]">Tên Dịch Vụ</th>
            <th className="min-w-[140px]">Mặt Hàng Áp Dụng</th>
            <th className="min-w-[120px]">Cơ Sở Tính Giá</th>
            <th className="min-w-[120px] text-right">Đơn Giá (VND)</th>
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
              const procBadge = getProcedureBadge(item.customsProcedure);
              const serviceBadge = getServiceCodeBadge(item.serviceCode);
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

                  {/* Loại hình */}
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${procBadge.className}`}
                    >
                      {procBadge.label}
                    </span>
                  </td>

                  {/* Chi cục / Địa điểm */}
                  <td>
                    <div className="font-semibold text-foreground">
                      {item.customsOfficeName}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      Mã: {item.customsOfficeId}
                    </div>
                  </td>

                  {/* Đại lý / Provider */}
                  <td>
                    <div className="font-medium text-foreground">
                      {item.providerName}
                    </div>
                  </td>

                  {/* Tên dịch vụ */}
                  <td>
                    <div className="font-semibold text-foreground">
                      {item.serviceName}
                    </div>
                    <div className={`text-[11px] ${serviceBadge.className}`}>
                      {serviceBadge.label}
                    </div>
                  </td>

                  {/* Mặt hàng */}
                  <td>
                    <span className="font-medium text-foreground">
                      {item.commodityName}
                    </span>
                  </td>

                  {/* Cơ sở tính giá */}
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-muted text-muted-foreground font-mono">
                      {basisObj?.unit || item.rateBasis}
                    </span>
                  </td>

                  {/* Đơn giá */}
                  <td className="text-right">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(item.unitPrice, item.currency)}
                    </span>
                  </td>

                  {/* Hiệu lực */}
                  <td className="text-center text-muted-foreground font-mono text-[11px]">
                    <div className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span>{item.validFrom || "---"}</span>
                      <span>→</span>
                      <span>{item.validTo || "---"}</span>
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
                      <button
                        type="button"
                        aria-label="Xem chi tiết biểu phí"
                        onClick={() => onView(item)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Chỉnh sửa biểu phí"
                        onClick={() => onEdit(item)}
                        className="p-1 rounded text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Đổi trạng thái biểu phí"
                        onClick={() => onToggleStatus(item)}
                        className="p-1 rounded text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Xóa biểu phí"
                        onClick={() => onDelete(item)}
                        className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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

