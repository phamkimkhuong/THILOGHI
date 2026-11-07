"use client";

import {
  X,
  Package,
  Layers,
  Sparkles,
  Calendar,
  User,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  FileText,
  Boxes,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ORIGIN_CONFIG, type CommodityRecord } from "./types";

interface CommodityDetailDrawerProps {
  commodity: CommodityRecord | null;
  onClose: () => void;
  onEdit: (commodity: CommodityRecord) => void;
  onToggle: (commodity: CommodityRecord) => void;
  onDelete: (commodity: CommodityRecord) => void;
}

export function CommodityDetailDrawer({
  commodity,
  onClose,
  onEdit,
  onToggle,
  onDelete,
}: CommodityDetailDrawerProps) {
  if (!commodity) return null;

  const originCfg = ORIGIN_CONFIG[commodity.origin || ""] || {
    name: commodity.origin || "Chưa xác định",
    flag: "📍",
    badgeClass: "bg-surface border-border text-foreground",
  };
  const isApproved = commodity.status === "Đã duyệt" || commodity.status === "Active";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200 font-sans">
      <div
        className="w-full sm:max-w-md md:max-w-lg bg-surface border-l border-border h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="commodity-drawer-title"
      >
        {/* Header Drawer */}
        <div className="p-4 border-b border-border flex items-start justify-between bg-surface-hover">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600 border border-blue-200 dark:border-blue-800">
                <Package className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {commodity.commodityId}
              </span>
              <StatusBadge status={isApproved ? "APPROVED" : "INACTIVE"} />
            </div>
            <h2 id="commodity-drawer-title" className="text-base font-bold text-foreground leading-snug">
              {commodity.name}
            </h2>
            {commodity.englishName && (
              <p className="text-xs text-muted-foreground italic font-normal">
                Tên tiếng Anh: <strong className="text-foreground">{commodity.englishName}</strong>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung chi tiết Drawer */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-foreground">
          {/* Nhóm & Quy cách */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-muted-foreground text-[11px] block">Nhóm phân loại</span>
              <div className="mt-1 font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                <span>{commodity.category}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-muted-foreground text-[11px] block">Quy cách đóng gói</span>
              <div className="mt-1 font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>{commodity.specifications || "Chưa cập nhật"}</span>
              </div>
            </div>
          </div>

          {/* Xuất xứ & Mục đích sử dụng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-muted-foreground text-[11px] block">Quốc gia xuất xứ</span>
              <div className="mt-1 flex items-center gap-1.5 font-semibold text-foreground text-sm">
                <span>{originCfg.flag}</span>
                <span>{commodity.origin || "Chưa xác định"}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-muted-foreground text-[11px] block">Mục đích sử dụng</span>
              <div className="mt-1 font-semibold text-foreground text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>{commodity.purpose || "Chưa cập nhật"}</span>
              </div>
            </div>
          </div>

          {/* Thành phần cấu tạo (nếu có) */}
          {commodity.components && (
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-1.5">
              <span className="text-muted-foreground text-[11px] flex items-center gap-1 font-medium">
                <Boxes className="w-3.5 h-3.5 text-indigo-600" /> Thành phần cấu tạo:
              </span>
              <p className="text-foreground text-xs leading-relaxed font-medium">
                {commodity.components}
              </p>
            </div>
          )}

          {/* Ghi chú nghiệp vụ / Lưu ý vận tải */}
          {commodity.note && (
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-1.5">
              <span className="text-muted-foreground text-[11px] flex items-center gap-1 font-medium">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Ghi chú nghiệp vụ & Hướng dẫn:
              </span>
              <p className="text-foreground text-xs leading-relaxed bg-surface p-2.5 rounded-lg border border-border">
                {commodity.note}
              </p>
            </div>
          )}

          {/* Thông tin Audit & Quản trị dữ liệu */}
          <div className="p-3 rounded-xl bg-background border border-border space-y-1.5 text-muted-foreground text-[11px]">
            {commodity.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Ngày khởi tạo: {new Date(commodity.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
            )}
            {commodity.createdBy && (
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                <span>
                  Người tạo: <strong className="text-foreground">{commodity.createdBy}</strong>
                </span>
              </div>
            )}
            {commodity.updatedBy && (
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>
                  Cập nhật lần cuối bởi: <strong className="text-foreground">{commodity.updatedBy}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Drawer: Thao tác Quản trị */}
        <div className="p-4 border-t border-border bg-surface-hover space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Thao tác Quản trị
          </span>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onEdit(commodity)}
              className="flex items-center justify-center gap-1 text-xs"
            >
              <Pencil className="w-3.5 h-3.5" /> Sửa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggle(commodity)}
              className="flex items-center justify-center gap-1 text-xs"
            >
              {isApproved ? (
                <>
                  <PowerOff className="w-3.5 h-3.5 text-amber-600" /> Tạm ngưng
                </>
              ) : (
                <>
                  <Power className="w-3.5 h-3.5 text-emerald-600" /> Phê duyệt
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(commodity)}
              className="flex items-center justify-center gap-1 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}