"use client";

import {
  TableContainer,
  TableFeedback,
  Pagination,
  usePagination,
} from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Truck, Eye, Pencil, Trash2 } from "lucide-react";
import {
  TractorFleetItem,
  getOwnershipBadge,
  getTransitRouteBadge,
} from "./types";

interface TractorsTableProps {
  tractors: TractorFleetItem[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onView: (tractor: TractorFleetItem) => void;
  onEdit: (tractor: TractorFleetItem) => void;
  onDelete: (tractor: TractorFleetItem) => void;
  filterKey: string;
}

export function TractorsTable({
  tractors,
  loading,
  loadError,
  onRetry,
  onView,
  onEdit,
  onDelete,
  filterKey,
}: TractorsTableProps) {
  const pagination = usePagination(tractors.length, filterKey);
  const paginatedList = tractors.slice(pagination.start, pagination.end);

  return (
    <div className="space-y-3 font-sans">
      <TableContainer ariaLabel="Bảng danh sách xe đầu kéo THILOGI">
        <table className="erp-table w-full text-left text-xs text-foreground">
          <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">STT</th>
              <th className="py-2.5 px-3">Biển số đầu kéo</th>
              <th className="py-2.5 px-3">Đơn vị sở hữu / Nhà xe</th>
              <th className="py-2.5 px-3">Dòng xe / Model</th>
              <th className="py-2.5 px-3">Tuyến liên vận</th>
              <th className="py-2.5 px-3 text-right">Khối lượng kéo theo</th>
              <th className="py-2.5 px-3 text-center">Trạng thái</th>
              <th className="py-2.5 px-3 text-center w-16">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading || loadError ? (
              <TableFeedback
                columns={8}
                loading={loading}
                error={loadError}
                onRetry={onRetry}
              />
            ) : paginatedList.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8">
                  <EmptyState
                    icon={Truck}
                    title="Không tìm thấy xe đầu kéo phù hợp"
                    description="Hãy thử thay đổi từ khóa biển số xe, nhà xe hoặc tuyến liên vận."
                  />
                </td>
              </tr>
            ) : (
              paginatedList.map((t, idx) => {
                const ownBadge = getOwnershipBadge(t.vendorId, t.vendorName);
                const routeBadge = getTransitRouteBadge(t.transitRoute);

                return (
                  <tr
                    key={t.tractorNo}
                    className="hover:bg-surface-hover transition-colors cursor-pointer group"
                    onClick={() => onView(t)}
                  >
                    <td className="py-2.5 px-3 font-mono text-muted-foreground text-center text-xs">
                      {pagination.start + idx + 1}
                    </td>

                    {/* Biển số xe */}
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-sm text-blue-600 dark:text-cyan-400 group-hover:underline">
                        {t.tractorNo}
                      </span>
                      {t.productionYear && (
                        <span className="block text-[11px] text-muted-foreground">
                          Đời xe: {t.productionYear}
                        </span>
                      )}
                    </td>

                    {/* Đơn vị sở hữu */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground">
                          {t.vendorShortName || t.vendorName}
                        </span>
                        <div>
                          <span
                            className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-medium border ${ownBadge.badgeClass}`}
                          >
                            {ownBadge.label}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Dòng xe / Model */}
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      {t.modelType && t.modelType !== "Unknown" ? (
                        t.modelType
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>

                    {/* Tuyến liên vận */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${routeBadge.badgeClass}`}
                      >
                        {routeBadge.label}
                      </span>
                    </td>

                    {/* Khối lượng kéo theo */}
                    <td className="py-2.5 px-3 text-right font-mono text-foreground">
                      {t.loadCapacityTons != null ? (
                        <span className="font-semibold">
                          {new Intl.NumberFormat("vi-VN", {
                            maximumFractionDigits: 2,
                          }).format(t.loadCapacityTons)}{" "}
                          tấn
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={t.status} />
                    </td>

                    {/* Thao tác */}
                    <td
                      className="py-2.5 px-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onView(t)}
                          className="p-1.5 text-muted-foreground hover:text-blue-600 rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer"
                          title="Xem chi tiết đầu kéo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(t)}
                          className="p-1.5 text-muted-foreground hover:text-amber-600 rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer"
                          title="Chỉnh sửa đầu kéo"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(t)}
                          className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer"
                          title="Xóa đầu kéo"
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

      <Pagination
        pagination={pagination}
        loading={loading}
        error={!!loadError}
        loaded={tractors.length}
        limit={pagination.size}
      />
    </div>
  );
}
