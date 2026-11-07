"use client";

import {
  Package,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Wheat,
  Tractor,
  FlaskConical,
  Fish,
  Sprout,
  Box,
  Layers,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableFeedback, Pagination, usePagination, TableContainer } from "@/components/ui/list-page";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ORIGIN_CONFIG, type CommodityRecord } from "./types";

interface CommodityTableProps {
  commodities: CommodityRecord[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onView: (commodity: CommodityRecord) => void;
  onEdit: (commodity: CommodityRecord) => void;
  onToggle: (commodity: CommodityRecord) => void;
  onDelete: (commodity: CommodityRecord) => void;
  filterKey: string;
  totalOriginal: number;
  onResetFilters: () => void;
}

export function CommodityTable({
  commodities,
  loading,
  loadError,
  onRetry,
  onView,
  onEdit,
  onToggle,
  onDelete,
  filterKey,
  totalOriginal,
  onResetFilters,
}: CommodityTableProps) {
  const pagination = usePagination(commodities.length, filterKey);

  const getCategoryIcon = (cat: string) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("nông sản") || c.includes("chuối") || c.includes("sắn") || c.includes("lâm sản")) {
      return <Wheat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (c.includes("máy móc") || c.includes("cơ khí") || c.includes("thiết bị")) {
      return <Tractor className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
    if (c.includes("phân bón") || c.includes("thuốc") || c.includes("hóa chất")) {
      return <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
    if (c.includes("thủy sản") || c.includes("cá")) {
      return <Fish className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    }
    if (c.includes("cây giống")) {
      return <Sprout className="w-4 h-4 text-lime-600 dark:text-lime-400" />;
    }
    if (c.includes("container")) {
      return <Box className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
    return <Package className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-2 font-sans">
      <TableContainer ariaLabel="Bảng dữ liệu hàng hóa">
        <table className="erp-table w-full text-left text-xs text-foreground">
          <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2.5 px-3 whitespace-nowrap">Mã hàng</th>
              <th className="py-2.5 px-3 min-w-[220px]">Tên hàng hóa (Song ngữ)</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Nhóm / Phân loại</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Quy cách đóng gói</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Xuất xứ & Mục đích</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Trạng thái</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-sans">
            {loading || loadError ? (
              <TableFeedback columns={7} loading={loading} error={loadError} onRetry={onRetry} />
            ) : commodities.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8">
                  <EmptyState
                    icon={Package}
                    title="Không tìm thấy mặt hàng phù hợp"
                    description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bấm 'Bỏ lọc' để quay lại toàn bộ danh mục hàng hóa."
                    action={
                      <Button variant="primary" size="sm" onClick={onResetFilters}>
                        Hiển thị tất cả mặt hàng
                      </Button>
                    }
                  />
                </td>
              </tr>
            ) : (
              commodities.slice(pagination.start, pagination.end).map((c) => {
                const originCfg = ORIGIN_CONFIG[c.origin || ""] || {
                  name: c.origin || "Chưa xác định",
                  flag: "📍",
                  badgeClass: "bg-surface border-border text-foreground",
                };
                const isApproved = c.status === "Đã duyệt" || c.status === "Active";

                return (
                  <tr
                    key={c.commodityId}
                    onClick={() => onView(c)}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
                  >
                    {/* Cột 1: Mã hàng */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-xs text-blue-600 dark:text-cyan-400">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                        {c.commodityId}
                      </span>
                    </td>

                    {/* Cột 2: Tên hàng hóa song ngữ */}
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      <div className="flex items-start gap-2">
                        <span className="p-1 rounded bg-surface border border-border shrink-0 mt-0.5">
                          {getCategoryIcon(c.category)}
                        </span>
                        <div>
                          <div className="font-bold text-foreground group-hover:text-blue-600 transition-colors">
                            {c.name}
                          </div>
                          {c.englishName ? (
                            <div className="text-[11px] text-muted-foreground italic font-normal">
                              {c.englishName}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Cột 3: Nhóm / Phân loại */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-surface border border-border font-medium text-muted-foreground">
                        {c.category}
                      </span>
                    </td>

                    {/* Cột 4: Quy cách đóng gói */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {c.specifications ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium">
                          <Layers className="w-3 h-3" />
                          {c.specifications}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Cột 5: Xuất xứ & Mục đích */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>{originCfg.flag}</span>
                        <span>{c.origin || "-"}</span>
                      </div>
                      {c.purpose && (
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                          <span>{c.purpose}</span>
                        </div>
                      )}
                    </td>

                    {/* Cột 6: Trạng thái */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <StatusBadge status={isApproved ? "APPROVED" : "INACTIVE"} />
                    </td>

                    {/* Cột 7: Thao tác CRUD */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* Nút Xem chi tiết */}
                        <button
                          type="button"
                          onClick={() => onView(c)}
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/40 text-muted-foreground transition-colors cursor-pointer"
                          title="Xem hồ sơ hàng hóa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Nút Chỉnh sửa */}
                        <button
                          type="button"
                          onClick={() => onEdit(c)}
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 dark:hover:bg-amber-950/40 text-muted-foreground transition-colors cursor-pointer"
                          title="Chỉnh sửa hàng hóa"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Nút Bật/Tắt trạng thái */}
                        <button
                          type="button"
                          onClick={() => onToggle(c)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isApproved
                              ? "border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
                              : "border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                          }`}
                          title={isApproved ? "Tạm ngưng mặt hàng này" : "Kích hoạt lại mặt hàng này"}
                        >
                          {isApproved ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                        </button>

                        {/* Nút Xóa */}
                        <button
                          type="button"
                          onClick={() => onDelete(c)}
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/40 text-muted-foreground transition-colors cursor-pointer"
                          title="Xóa hàng hóa"
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

      {/* Thanh Phân Trang */}
      <Pagination
        pagination={pagination}
        loading={loading}
        error={!!loadError}
        loaded={totalOriginal}
        limit={50}
        sizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
}

