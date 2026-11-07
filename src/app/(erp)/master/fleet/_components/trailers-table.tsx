"use client";

import {
  TableContainer,
  TableFeedback,
  Pagination,
  usePagination,
} from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Container, Eye, AlertTriangle } from "lucide-react";
import {
  TrailerFleetItem,
  getOwnershipBadge,
  getTransitRouteBadge,
} from "./types";

interface TrailersTableProps {
  trailers: TrailerFleetItem[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onView: (trailer: TrailerFleetItem) => void;
  filterKey: string;
}

export function TrailersTable({
  trailers,
  loading,
  loadError,
  onRetry,
  onView,
  filterKey,
}: TrailersTableProps) {
  const pagination = usePagination(trailers.length, filterKey);
  const paginatedList = trailers.slice(pagination.start, pagination.end);

  const renderStatus = (status: string) => {
    if (status.includes("Quá hạn")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="w-3 h-3 text-rose-500" />
          <span>{status}</span>
        </span>
      );
    }
    if (status.includes("Chưa nhập")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <span>{status}</span>
        </span>
      );
    }
    return <StatusBadge status={status} />;
  };

  return (
    <div className="space-y-3 font-sans">
      <TableContainer ariaLabel="Bảng danh sách rơ-moóc THILOGI">
        <table className="erp-table w-full text-left text-xs text-foreground">
          <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">STT</th>
              <th className="py-2.5 px-3">Biển số rơ-moóc</th>
              <th className="py-2.5 px-3">Đơn vị sở hữu / Nhà xe</th>
              <th className="py-2.5 px-3">Chủng loại moóc</th>
              <th className="py-2.5 px-3">Nhà sản xuất</th>
              <th className="py-2.5 px-3 text-right">Tải trọng chở hàng</th>
              <th className="py-2.5 px-3 text-center">Tình trạng đăng kiểm</th>
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
                    icon={Container}
                    title="Không tìm thấy rơ-moóc phù hợp"
                    description="Hãy thử thay đổi từ khóa tìm kiếm biển số moóc, nhà sản xuất hoặc chủng loại chuyên dụng."
                  />
                </td>
              </tr>
            ) : (
              paginatedList.map((tr, idx) => {
                const ownBadge = getOwnershipBadge(tr.vendorId, tr.vendorName);
                const routeBadge = getTransitRouteBadge(tr.transitRoute);

                return (
                  <tr
                    key={tr.trailerNo}
                    className="hover:bg-surface-hover transition-colors cursor-pointer group"
                    onClick={() => onView(tr)}
                  >
                    <td className="py-2.5 px-3 font-mono text-muted-foreground text-center text-xs">
                      {pagination.start + idx + 1}
                    </td>

                    {/* Biển số moóc */}
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-sm text-blue-600 dark:text-cyan-400 group-hover:underline">
                        {tr.trailerNo}
                      </span>
                      {tr.productionYear && (
                        <span className="block text-[11px] text-muted-foreground">
                          Năm SX: {tr.productionYear}
                        </span>
                      )}
                    </td>

                    {/* Đơn vị sở hữu */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground">
                          {tr.vendorShortName || tr.vendorName}
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

                    {/* Chủng loại moóc */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-foreground">
                          {tr.modelType && tr.modelType !== "Unknown"
                            ? tr.modelType
                            : "Moóc tiêu chuẩn"}
                        </span>
                        {tr.transitRoute && tr.transitRoute !== "Unknown" && (
                          <div>
                            <span
                              className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-medium border ${routeBadge.badgeClass}`}
                            >
                              {routeBadge.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Nhà sản xuất */}
                    <td className="py-2.5 px-3 text-foreground font-medium">
                      {tr.manufacturer && tr.manufacturer !== "Unknown" ? (
                        tr.manufacturer
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>

                    {/* Tải trọng chở hàng */}
                    <td className="py-2.5 px-3 text-right font-mono text-foreground">
                      {tr.payloadCapacityTons != null ? (
                        <span className="font-semibold text-foreground">
                          {new Intl.NumberFormat("vi-VN", {
                            maximumFractionDigits: 2,
                          }).format(tr.payloadCapacityTons)}{" "}
                          tấn
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>

                    {/* Trạng thái / Đăng kiểm */}
                    <td className="py-2.5 px-3 text-center">
                      {renderStatus(tr.status)}
                    </td>

                    {/* Thao tác */}
                    <td
                      className="py-2.5 px-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onView(tr)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer"
                        title="Xem chi tiết rơ-moóc"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
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
        loaded={trailers.length}
        limit={pagination.size}
      />
    </div>
  );
}
