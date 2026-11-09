"use client";

import {
  X,
  Container,
  Pencil,
  Power,
  Snowflake,
  Layers,
  Calendar,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { MasterEquipmentTypeItem } from "./types";

interface EquipmentDetailDrawerProps {
  item: MasterEquipmentTypeItem | null;
  onClose: () => void;
  onEdit: (item: MasterEquipmentTypeItem) => void;
  onToggleStatus: (item: MasterEquipmentTypeItem) => void;
}

export function EquipmentDetailDrawer({
  item,
  onClose,
  onEdit,
  onToggleStatus,
}: EquipmentDetailDrawerProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200 font-sans">
      <div
        className="w-full sm:max-w-md md:max-w-lg bg-surface border-l border-border h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header Drawer */}
        <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between bg-muted/20">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-[#2672df] border border-blue-200 shrink-0 mt-0.5">
              <Container className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-muted border border-border">
                  {item.equipmentTypeId}
                </span>
                {item.isReefer && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center gap-1">
                    <Snowflake className="w-2.5 h-2.5" /> Reefer (Lạnh)
                  </span>
                )}
              </div>
              <h2
                id="drawer-title"
                className="text-base sm:text-lg font-bold text-foreground mt-1"
              >
                {item.equipmentName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Đóng ngăn kéo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung thông tin chi tiết */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Card trạng thái & phân loại */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px] mb-1">
                Trạng thái áp dụng
              </span>
              <StatusBadge status={item.isActive ? "ACTIVE" : "INACTIVE"} />
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] mb-1">
                Phân loại thiết bị
              </span>
              <span className="font-semibold text-foreground">
                {item.categoryName || item.category}
              </span>
            </div>
          </div>

          {/* Container lạnh */}
          <div className="p-3.5 rounded-xl bg-muted/20 border border-border space-y-2 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Snowflake className="w-3.5 h-3.5 text-cyan-600" /> Đặc tính nhiệt độ / Container lạnh
            </span>
            <p className="text-foreground">
              {item.isReefer ? (
                <span className="text-cyan-800 font-semibold">
                  Container Lạnh: Tự động kích hoạt tính phí cắm điện lạnh (POWER) và phụ phí THC cảng container lạnh bắt buộc.
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Container tiêu chuẩn khô hoặc phương tiện vận tải thông thường.
                </span>
              )}
            </p>
          </div>

          {/* Danh sách Aliases */}
          <div className="space-y-2 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Các mã tương đương (Aliases)
            </span>
            <div className="p-3 rounded-lg border border-border bg-surface flex flex-wrap gap-1.5">
              {item.aliases && item.aliases.length > 0 ? (
                item.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="px-2 py-1 rounded bg-blue-50 text-[#163b74] font-mono text-xs font-bold border border-blue-100"
                  >
                    {alias}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-xs">Chưa cấu hình mã tương đương</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              * Khi tra cứu biểu phí cảng, cước biển hoặc cước đường bộ, hệ thống sẽ tự động so khớp bất kỳ mã nào trong danh sách trên.
            </p>
          </div>

          {/* Ngày khởi tạo & Cập nhật */}
          {(item.createdAt || item.updatedAt) && (
            <div className="pt-3 border-t border-border/80 flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Cập nhật:
              </div>
              <span className="font-mono">
                {item.updatedAt
                  ? new Date(item.updatedAt).toLocaleDateString("vi-VN")
                  : "Ban đầu"}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(item)}
            className={
              item.isActive
                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            }
          >
            <Power className="w-3.5 h-3.5 mr-1" />
            {item.isActive ? "Tạm dừng áp dụng" : "Kích hoạt áp dụng"}
          </Button>

          <Button
            size="sm"
            onClick={() => onEdit(item)}
            className="bg-[#2672df] hover:bg-blue-600 text-white"
          >
            <Pencil className="w-3.5 h-3.5 mr-1" /> Chỉnh sửa thiết bị
          </Button>
        </div>
      </div>
    </div>
  );
}

