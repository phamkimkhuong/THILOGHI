"use client";

import { Eye, Pencil, Power, Container, Snowflake } from "lucide-react";
import { TableContainer } from "@/components/ui/list-page";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { MasterEquipmentTypeItem } from "./types";

interface EquipmentTableProps {
  items: MasterEquipmentTypeItem[];
  loading?: boolean;
  onView: (item: MasterEquipmentTypeItem) => void;
  onEdit: (item: MasterEquipmentTypeItem) => void;
  onToggleStatus: (item: MasterEquipmentTypeItem) => void;
  onResetFilters?: () => void;
}

export function EquipmentTable({
  items,
  loading = false,
  onView,
  onEdit,
  onToggleStatus,
  onResetFilters,
}: EquipmentTableProps) {
  if (!loading && items.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy thiết bị nào"
        description="Không có loại container hoặc thiết bị nào khớp với tiêu chí lọc hiện tại."
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
    <TableContainer ariaLabel="Bảng danh mục loại thiết bị và container">
      <table className="erp-table w-full text-left text-xs font-sans">
        <thead>
          <tr>
            <th className="w-12 text-center">STT</th>
            <th className="min-w-[120px]">Mã Chuẩn (Code)</th>
            <th className="min-w-[220px]">Tên Loại Thiết Bị &amp; Quy Cách</th>
            <th className="min-w-[150px]">Phân Loại</th>
            <th className="min-w-[130px] text-center">Container Lạnh?</th>
            <th className="min-w-[180px]">Mã Tương Đương (Aliases)</th>
            <th className="w-28 text-center">Trạng Thái</th>
            <th className="w-28 text-center">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item, index) => (
            <tr
              key={item.equipmentTypeId}
              className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
              onClick={() => onView(item)}
            >
              <td className="text-center text-muted-foreground font-mono">
                {index + 1}
              </td>

              {/* Mã chuẩn */}
              <td>
                <div className="flex items-center gap-1.5">
                  <Container className="w-3.5 h-3.5 text-[#2672df] shrink-0" />
                  <span className="font-mono font-bold text-foreground">
                    {item.equipmentTypeId}
                  </span>
                </div>
              </td>

              {/* Tên loại thiết bị */}
              <td>
                <div className="font-medium text-foreground">
                  {item.equipmentName}
                </div>
              </td>

              {/* Phân loại */}
              <td>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {item.categoryName || item.category}
                </span>
              </td>

              {/* Cờ cont lạnh */}
              <td className="text-center">
                {item.isReefer ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                    <Snowflake className="w-3 h-3 text-cyan-600" /> Có (Reefer)
                  </span>
                ) : (
                  <span className="text-muted-foreground text-[11px]">Không</span>
                )}
              </td>

              {/* Aliases */}
              <td>
                <div className="flex flex-wrap gap-1">
                  {item.aliases && item.aliases.length > 0 ? (
                    item.aliases.map((alias) => (
                      <span
                        key={alias}
                        className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-[#163b74] font-mono text-[10px] font-semibold border border-blue-100"
                      >
                        {alias}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-[11px]">—</span>
                  )}
                </div>
              </td>

              {/* Trạng thái */}
              <td className="text-center" onClick={(e) => e.stopPropagation()}>
                <StatusBadge status={item.isActive ? "ACTIVE" : "INACTIVE"} />
              </td>

              {/* Thao tác */}
              <td className="text-center" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title="Xem chi tiết"
                    onClick={() => onView(item)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="Chỉnh sửa"
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 w-7 p-0 ${
                      item.isActive
                        ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    }`}
                    title={item.isActive ? "Tạm dừng áp dụng" : "Kích hoạt áp dụng"}
                    onClick={() => onToggleStatus(item)}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableContainer>
  );
}

