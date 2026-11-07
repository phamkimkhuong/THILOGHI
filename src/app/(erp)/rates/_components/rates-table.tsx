"use client";

import { Building2, Eye, Layers, MapPin, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { TableContainer, TableFeedback, Pagination, usePagination } from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { RoadRateItem } from "./types";

interface RatesTableProps {
  rates: RoadRateItem[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  filterKey: string;
  totalOriginal: number;
  onView?: (rate: RoadRateItem) => void;
  onEdit?: (rate: RoadRateItem) => void;
  onToggle?: (rate: RoadRateItem) => void;
  onDelete?: (rate: RoadRateItem) => void;
}

export function RatesTable({
  rates,
  loading,
  loadError,
  onRetry,
  filterKey,
  totalOriginal,
  onView,
  onEdit,
  onToggle,
  onDelete,
}: RatesTableProps) {
  const pagination = usePagination(rates.length, filterKey);

  return (
    <div className="space-y-2 font-sans">
      <TableContainer ariaLabel="Bảng biểu cước giá mua đường bộ">
        <table className="erp-table w-full text-left text-xs text-foreground">
          <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2.5 px-3 text-center w-12 whitespace-nowrap">STT</th>
              <th className="py-2.5 px-3 min-w-[180px] whitespace-nowrap">Nhà cung cấp / Đối tác</th>
              <th className="py-2.5 px-3 min-w-[180px] whitespace-nowrap">Điểm xếp hàng (Origin)</th>
              <th className="py-2.5 px-3 min-w-[180px] whitespace-nowrap">Điểm dỡ hàng (Destination)</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Thiết bị / Cont</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Đơn giá mua</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Thời hạn hiệu lực</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Trạng thái</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-sans">
            {loading || loadError ? (
              <TableFeedback columns={9} loading={loading} error={loadError} onRetry={onRetry} />
            ) : rates.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8">
                  <EmptyState
                    icon={Layers}
                    title="Không tìm thấy bảng giá cước phù hợp"
                    description="Không có tuyến vận chuyển nào khớp với bộ lọc hoặc từ khóa tìm kiếm hiện tại."
                  />
                </td>
              </tr>
            ) : (
              rates.slice(pagination.start, pagination.end).map((r, idx) => (
                <tr key={r.rateId} className="hover:bg-surface-hover transition-colors">
                  {/* Cột 1: STT */}
                  <td className="py-2.5 px-3 text-center font-mono text-muted-foreground text-xs">
                    {pagination.start + idx + 1}
                  </td>

                  {/* Cột 2: Nhà cung cấp */}
                  <td className="py-2.5 px-3 font-semibold text-foreground max-w-[220px]" title={r.vendorName}>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{r.vendorName}</span>
                    </div>
                  </td>

                  {/* Cột 3: Điểm xếp hàng */}
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span>{r.pickupName}</span>
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground ml-4">
                      {r.pickupCode}
                    </div>
                  </td>

                  {/* Cột 4: Điểm dỡ hàng */}
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span>{r.deliveryName}</span>
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground ml-4">
                      {r.deliveryCode}
                    </div>
                  </td>

                  {/* Cột 5: Thiết bị / Cont */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-surface border border-border font-mono font-semibold text-foreground text-xs">
                      {r.equipmentType}
                    </span>
                  </td>

                  {/* Cột 6: Đơn giá mua */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                    {new Intl.NumberFormat("vi-VN", {
                      maximumFractionDigits: r.currency === "VND" ? 0 : 2,
                    }).format(r.buyRate)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">{r.currency}</span>
                  </td>

                  {/* Cột 7: Hiệu lực */}
                  <td className="py-2.5 px-3 text-center font-mono text-xs text-foreground whitespace-nowrap">
                    <div>Từ {r.validFrom || "Không giới hạn"}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.validTo ? `Đến ${r.validTo}` : "Không thời hạn"}
                    </div>
                  </td>

                  {/* Cột 8: Trạng thái */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <StatusBadge status={r.status} />
                  </td>

                  {/* Cột 9: Thao tác */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {onView && (
                        <button
                          type="button"
                          onClick={() => onView(r)}
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Xem chi tiết biểu cước"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(r)}
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/40 text-muted-foreground transition-colors cursor-pointer"
                          title="Chỉnh sửa biểu cước"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onToggle && (
                        <button
                          type="button"
                          onClick={() => onToggle(r)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            r.status === "APPROVED" || r.status === "Active"
                              ? "border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
                              : "border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                          }`}
                          title={
                            r.status === "APPROVED" || r.status === "Active"
                              ? "Ngừng áp dụng biểu cước này"
                              : "Kích hoạt áp dụng biểu cước này"
                          }
                        >
                          {r.status === "APPROVED" || r.status === "Active" ? (
                            <PowerOff className="w-3.5 h-3.5" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(r)}
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/40 text-muted-foreground transition-colors cursor-pointer"
                          title="Xóa biểu cước"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableContainer>

      {/* Phân trang chuẩn */}
      <Pagination
        pagination={pagination}
        loading={loading}
        error={!!loadError}
        loaded={totalOriginal}
        limit={250}
        sizeOptions={[25, 50, 100, 250]}
      />
    </div>
  );
}

