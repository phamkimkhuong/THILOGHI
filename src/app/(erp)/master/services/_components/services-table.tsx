"use client";

import { Eye, Pencil, Power, Layers } from "lucide-react";
import { TableContainer } from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  MasterServicePackage,
  getCategoryBadge,
  getPricingTypeBadge,
} from "./types";

interface ServicesTableProps {
  services: MasterServicePackage[];
  loading?: boolean;
  onView: (service: MasterServicePackage) => void;
  onEdit: (service: MasterServicePackage) => void;
  onToggleStatus: (service: MasterServicePackage) => void;
  onResetFilters?: () => void;
}

export function ServicesTable({
  services,
  loading = false,
  onView,
  onEdit,
  onToggleStatus,
  onResetFilters,
}: ServicesTableProps) {
  if (!loading && services.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy gói dịch vụ nào"
        description="Không có gói dịch vụ nào khớp với tiêu chí tìm kiếm hoặc phân loại đã chọn."
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
    <TableContainer ariaLabel="Bảng danh mục 8 gói dịch vụ chuẩn">
      <table className="erp-table w-full text-left text-xs font-sans">
        <thead>
          <tr>
            <th className="w-12 text-center">STT</th>
            <th className="min-w-[150px]">Mã Gói (Code)</th>
            <th className="min-w-[220px]">Tên Dịch Vụ &amp; Phạm Vi</th>
            <th className="min-w-[140px]">Phân Nhóm</th>
            <th className="min-w-[160px]">Cách Tính Cước</th>
            <th className="w-24 text-center">Đơn Vị Tính</th>
            <th className="w-28 text-center">Trạng Thái</th>
            <th className="w-32 text-center">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {services.map((item, index) => {
            const catBadge = getCategoryBadge(item.serviceCategory);
            const pricingBadge = getPricingTypeBadge(item.pricingType);

            return (
              <tr
                key={item.serviceId}
                className="hover:bg-muted/40 transition-colors group cursor-pointer"
                onClick={() => onView(item)}
              >
                {/* STT */}
                <td className="text-center font-mono text-muted-foreground">
                  {item.sortOrder || index + 1}
                </td>

                {/* Mã gói dịch vụ */}
                <td>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-foreground text-xs px-2 py-0.5 rounded bg-muted/60 border border-border">
                      {item.serviceId}
                    </span>
                    {item.isCoreTransport && (
                      <span
                        title="Dịch vụ vận tải chính (Core Transport)"
                        className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0"
                      >
                        Core
                      </span>
                    )}
                  </div>
                </td>

                {/* Tên dịch vụ & Mô tả */}
                <td>
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground text-xs group-hover:text-primary transition-colors flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{item.serviceName}</span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-md">
                        {item.description}
                      </p>
                    )}
                  </div>
                </td>

                {/* Phân nhóm */}
                <td>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${catBadge.className}`}
                  >
                    {catBadge.label}
                  </span>
                </td>

                {/* Cách tính cước */}
                <td>
                  <div className="space-y-0.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${pricingBadge.className}`}
                    >
                      {pricingBadge.label}
                    </span>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {pricingBadge.desc}
                    </p>
                  </div>
                </td>

                {/* Đơn vị tính mặc định */}
                <td className="text-center">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-surface border border-border text-foreground">
                    {item.defaultUnit}
                  </span>
                </td>

                {/* Trạng thái */}
                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                  <StatusBadge status={item.isActive ? "ACTIVE" : "INACTIVE"} />
                </td>

                {/* Thao tác */}
                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(item)}
                      title="Xem chi tiết gói dịch vụ"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="sr-only">Xem chi tiết</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                      title="Chỉnh sửa cấu hình dịch vụ"
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="sr-only">Chỉnh sửa</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleStatus(item)}
                      title={item.isActive ? "Tạm dừng dịch vụ" : "Kích hoạt dịch vụ"}
                      className={`h-8 w-8 p-0 ${
                        item.isActive
                          ? "text-emerald-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                          : "text-rose-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span className="sr-only">
                        {item.isActive ? "Tạm dừng" : "Kích hoạt"}
                      </span>
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

