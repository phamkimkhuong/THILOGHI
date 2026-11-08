"use client";

import { Eye, Pencil, Power, Trash2, Anchor, Calendar } from "lucide-react";
import { TableContainer } from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  PortRateItem,
  formatCurrency,
  getChargeCodeBadge,
  getCargoTypeBadge,
} from "./types";

interface PortRatesTableProps {
  rates: PortRateItem[];
  loading?: boolean;
  onView: (rate: PortRateItem) => void;
  onEdit: (rate: PortRateItem) => void;
  onToggleStatus: (rate: PortRateItem) => void;
  onDelete: (rate: PortRateItem) => void;
  onResetFilters?: () => void;
}

export function PortRatesTable({
  rates,
  loading = false,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  onResetFilters,
}: PortRatesTableProps) {
  if (!loading && rates.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy biểu phí cảng nào"
        description="Không có bản ghi biểu phí cảng & depot nào khớp với tiêu chí tìm kiếm hoặc phân loại đã chọn."
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
    <TableContainer ariaLabel="Bảng biểu phí dịch vụ Cảng & Depot Chu Lai">
      <table className="erp-table w-full text-left text-xs font-sans">
        <thead>
          <tr>
            <th className="w-12 text-center">STT</th>
            <th className="min-w-[150px]">Tác Nghiệp (Code)</th>
            <th className="min-w-[180px]">Cảng &amp; Dịch Vụ</th>
            <th className="min-w-[140px]">Loại Cont &amp; Hàng</th>
            <th className="w-24 text-center">Đơn Vị Tính</th>
            <th className="min-w-[130px] text-right">Đơn Giá Mua</th>
            <th className="min-w-[140px] text-right">Quy Đổi (VND)</th>
            <th className="min-w-[160px] text-center">Thời Hạn Hiệu Lực</th>
            <th className="w-28 text-center">Trạng Thái</th>
            <th className="w-36 text-center">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rates.map((item, index) => {
            const chargeBadge = getChargeCodeBadge(item.chargeCode);
            const cargoBadge = getCargoTypeBadge(item.cargoType);

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

                {/* Tác nghiệp */}
                <td>
                  <div className="space-y-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${chargeBadge.className}`}
                    >
                      {item.chargeCode}
                    </span>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                      {chargeBadge.label}
                    </div>
                  </div>
                </td>

                {/* Cảng & Nhóm dịch vụ */}
                <td>
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground text-xs group-hover:text-primary transition-colors flex items-center gap-1">
                      <Anchor className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{item.portName}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                      {item.serviceCategory}
                    </div>
                  </div>
                </td>

                {/* Loại cont & Hàng */}
                <td>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono font-bold text-foreground text-xs px-2 py-0.5 rounded bg-muted/60 border border-border">
                      {item.containerType}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium border ${cargoBadge.className}`}
                    >
                      {cargoBadge.label}
                    </span>
                  </div>
                </td>

                {/* Đơn vị tính */}
                <td className="text-center font-medium text-foreground">
                  {item.unit}
                </td>

                {/* Đơn giá gốc */}
                <td className="text-right font-mono font-bold text-foreground">
                  {formatCurrency(item.unitPrice, item.currency)}
                </td>

                {/* Quy đổi VND */}
                <td className="text-right font-mono text-xs text-muted-foreground">
                  {item.currency === "VND" ? (
                    <span className="text-muted-foreground/60">-</span>
                  ) : (
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(item.unitPriceVnd, "VND")}
                    </span>
                  )}
                </td>

                {/* Hiệu lực */}
                <td className="text-center text-xs text-muted-foreground font-mono">
                  <div className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground/70" />
                    <span>
                      {item.validFrom} → {item.validTo}
                    </span>
                  </div>
                </td>

                {/* Trạng thái */}
                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                  <StatusBadge status={item.status} />
                </td>

                {/* Thao tác */}
                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => onView(item)}
                      title="Xem chi tiết"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                      onClick={() => onEdit(item)}
                      title="Chỉnh sửa đơn giá"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 w-7 p-0 ${
                        item.status === "ACTIVE"
                          ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                          : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                      }`}
                      onClick={() => onToggleStatus(item)}
                      title={
                        item.status === "ACTIVE"
                          ? "Tạm ngưng áp dụng"
                          : "Kích hoạt hiệu lực"
                      }
                    >
                      <Power className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      onClick={() => onDelete(item)}
                      title="Xóa biểu phí"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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

