"use client";

import {
  TableContainer,
  TableFeedback,
  Pagination,
  usePagination,
} from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { User, Phone, FileCheck, Eye, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { DriverFleetItem, getOwnershipBadge } from "./types";

interface DriversTableProps {
  drivers: DriverFleetItem[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onView: (driver: DriverFleetItem) => void;
  onEdit: (driver: DriverFleetItem) => void;
  onDelete: (driver: DriverFleetItem) => void;
  filterKey: string;
}

export function DriversTable({
  drivers,
  loading,
  loadError,
  onRetry,
  onView,
  onEdit,
  onDelete,
  filterKey,
}: DriversTableProps) {
  const pagination = usePagination(drivers.length, filterKey);
  const paginatedList = drivers.slice(pagination.start, pagination.end);

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
      <TableContainer ariaLabel="Bảng danh sách tài xế THILOGI">
        <table className="erp-table w-full text-left text-xs text-foreground">
          <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">STT</th>
              <th className="py-2.5 px-3">Mã & Họ tên tài xế</th>
              <th className="py-2.5 px-3">Đội xe / Nhà xe trực thuộc</th>
              <th className="py-2.5 px-3">Điện thoại hotline</th>
              <th className="py-2.5 px-3 font-mono">Số GPLX</th>
              <th className="py-2.5 px-3">Quê quán / Địa bàn</th>
              <th className="py-2.5 px-3 text-center">Tình trạng hồ sơ</th>
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
                    icon={User}
                    title="Không tìm thấy tài xế phù hợp"
                    description="Hãy thử thay đổi từ khóa tìm kiếm tên tài xế, số điện thoại, số GPLX hoặc quê quán."
                  />
                </td>
              </tr>
            ) : (
              paginatedList.map((d, idx) => {
                const ownBadge = getOwnershipBadge(d.vendorId, d.vendorName);

                return (
                  <tr
                    key={d.driverId}
                    className="hover:bg-surface-hover transition-colors cursor-pointer group"
                    onClick={() => onView(d)}
                  >
                    <td className="py-2.5 px-3 font-mono text-muted-foreground text-center text-xs">
                      {pagination.start + idx + 1}
                    </td>

                    {/* Mã & Họ tên tài xế */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-foreground text-xs group-hover:text-blue-600 transition-colors">
                          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>{d.fullName}</span>
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground block">
                          ID: {d.driverId}
                        </span>
                      </div>
                    </td>

                    {/* Đơn vị quản lý / Đội xe */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground">
                          {d.vendorShortName || d.vendorName}
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

                    {/* Điện thoại */}
                    <td
                      className="py-2.5 px-3 font-mono"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {d.phone ? (
                        <a
                          href={`tel:${d.phone}`}
                          className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                          title="Bấm để gọi"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{d.phone}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>

                    {/* Số GPLX */}
                    <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-cyan-400">
                      {d.licenseNo ? (
                        <div className="flex items-center gap-1">
                          <FileCheck className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span>{d.licenseNo}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>

                    {/* Quê quán / Địa bàn */}
                    <td className="py-2.5 px-3 text-foreground max-w-[200px] truncate">
                      {d.hometown || (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>

                    {/* Trạng thái / Tình trạng hồ sơ */}
                    <td className="py-2.5 px-3 text-center">
                      {renderStatus(d.status)}
                    </td>

                    {/* Thao tác */}
                    <td
                      className="py-2.5 px-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onView(d)}
                          className="p-1.5 text-muted-foreground hover:text-blue-600 rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer"
                          title="Xem chi tiết hồ sơ tài xế"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(d)}
                          className="p-1.5 text-muted-foreground hover:text-amber-600 rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer"
                          title="Chỉnh sửa hồ sơ tài xế"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(d)}
                          className="p-1.5 text-muted-foreground hover:text-rose-600 rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer"
                          title="Xóa tài xế"
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
        loaded={drivers.length}
        limit={pagination.size}
      />
    </div>
  );
}
