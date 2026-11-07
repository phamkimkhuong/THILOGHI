"use client";

import { useState } from "react";
import {
  X,
  Truck,
  Container,
  User,
  Building2,
  Calendar,
  Compass,
  FileCheck,
  CreditCard,
  Phone,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Tag,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  SelectedFleetItem,
  getOwnershipBadge,
  getTransitRouteBadge,
} from "./types";

interface FleetDetailDrawerProps {
  item: SelectedFleetItem;
  onClose: () => void;
  onEdit?: (item: NonNullable<SelectedFleetItem>) => void;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function FleetDetailDrawer({
  item,
  onClose,
  onEdit,
}: FleetDetailDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!item) return null;

  const handleCopy = (text: string, fieldName: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết tài sản / hồ sơ đội xe"
      className="fixed inset-0 z-50 overflow-hidden font-sans"
    >
      {/* Nền mờ click-to-close */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <aside className="w-screen max-w-lg bg-surface border-l border-border shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
          {/* Header Drawer */}
          <div className="p-4 border-b border-border bg-surface-hover flex items-start justify-between gap-3 shrink-0">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {item.type === "TRACTOR" && (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                      <Truck className="w-3 h-3" />
                      <span>Xe đầu kéo</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground px-2 py-0.5 rounded bg-surface border border-border">
                      {item.data.tractorNo}
                    </span>
                    {renderStatus(item.data.status)}
                  </>
                )}

                {item.type === "TRAILER" && (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      <Container className="w-3 h-3" />
                      <span>Rơ-moóc</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground px-2 py-0.5 rounded bg-surface border border-border">
                      {item.data.trailerNo}
                    </span>
                    {renderStatus(item.data.status)}
                  </>
                )}

                {item.type === "DRIVER" && (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                      <User className="w-3 h-3" />
                      <span>Tài xế / Lái xe</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground px-2 py-0.5 rounded bg-surface border border-border">
                      {item.data.driverId}
                    </span>
                    {renderStatus(item.data.status)}
                  </>
                )}
              </div>

              <h2 className="font-bold text-base text-foreground leading-snug">
                {item.type === "TRACTOR" && `Đầu kéo ${item.data.tractorNo}`}
                {item.type === "TRAILER" && `Rơ-moóc ${item.data.trailerNo}`}
                {item.type === "DRIVER" && item.data.fullName}
              </h2>

              <p className="text-xs text-muted-foreground">
                Đơn vị quản lý:{" "}
                <strong className="text-foreground">
                  {item.data.vendorShortName || item.data.vendorName}
                </strong>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface border border-border transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Thân Drawer: Danh sách các trường dữ liệu liên tục */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-foreground scrollbar-thin">
            {/* 1. HỒ SƠ ĐẦU KÉO */}
            {item.type === "TRACTOR" && (
              <div className="bg-background rounded-xl border border-border divide-y divide-border/60 overflow-hidden">
                {/* Biển số xe */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Biển kiểm soát</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-foreground">
                      {item.data.tractorNo}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.data.tractorNo, "biển số")}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Sao chép biển số"
                    >
                      {copiedField === "biển số" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Đơn vị sở hữu */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Đơn vị sở hữu</span>
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    {item.data.vendorName}
                  </div>
                </div>

                {/* Dòng xe / Model */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Dòng xe / Model</span>
                  </div>
                  <div className="text-xs font-medium text-foreground">
                    {item.data.modelType || "—"}
                  </div>
                </div>

                {/* Tuyến liên vận */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Compass className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Tuyến liên vận</span>
                  </div>
                  <div className="text-xs">
                    {(() => {
                      const b = getTransitRouteBadge(item.data.transitRoute);
                      return (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${b.badgeClass}`}
                        >
                          {b.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Ngày cấp phép liên vận */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Ngày cấp phép liên vận</span>
                  </div>
                  <div className="text-xs font-mono text-foreground">
                    {formatDate(item.data.transitLicenseDate)}
                  </div>
                </div>

                {/* Khối lượng kéo theo */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <span className="font-mono text-xs text-slate-500 font-bold">KG</span>
                    <span>Tải trọng kéo theo</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-foreground">
                    {item.data.loadCapacityTons != null
                      ? `${item.data.loadCapacityTons} tấn`
                      : "—"}
                  </div>
                </div>

                {/* Tự trọng xe */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <span className="font-mono text-xs text-slate-500 font-bold">W</span>
                    <span>Tự trọng xe</span>
                  </div>
                  <div className="text-xs font-mono text-foreground">
                    {item.data.selfWeightTons != null
                      ? `${item.data.selfWeightTons} tấn`
                      : "—"}
                  </div>
                </div>

                {/* Năm sản xuất & Màu sơn */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Năm SX & Màu sơn</span>
                  </div>
                  <div className="text-xs text-foreground">
                    {item.data.productionYear || "—"}{" "}
                    {item.data.color && item.data.color !== "Unknown" && (
                      <span className="text-muted-foreground">
                        • Màu {item.data.color}
                      </span>
                    )}
                  </div>
                </div>

                {/* Số khung */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Số khung (VIN)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-foreground">
                      {item.data.chassisNo || "—"}
                    </span>
                    {item.data.chassisNo && item.data.chassisNo !== "Unknown" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(item.data.chassisNo!, "số khung")
                        }
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Sao chép số khung"
                      >
                        {copiedField === "số khung" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Số máy */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Số máy</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-foreground">
                      {item.data.engineNo || "—"}
                    </span>
                    {item.data.engineNo && item.data.engineNo !== "Unknown" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(item.data.engineNo!, "số máy")
                        }
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Sao chép số máy"
                      >
                        {copiedField === "số máy" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Hạn kiểm định đăng kiểm */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Hạn đăng kiểm</span>
                  </div>
                  <div className="text-xs font-mono">
                    {item.data.inspectionExpirationDate ? (
                      <span className="font-semibold text-foreground">
                        {formatDate(item.data.inspectionExpirationDate)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">
                        Chưa cập nhật hạn đăng kiểm
                      </span>
                    )}
                  </div>
                </div>

                {/* Ghi chú */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36 pt-0.5">
                    <Tag className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span>Ghi chú nghiệp vụ</span>
                  </div>
                  <div className="text-xs text-foreground italic flex-1">
                    {item.data.notes || (
                      <span className="text-muted-foreground">
                        Không có ghi chú
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. HỒ SƠ RƠ-MOÓC */}
            {item.type === "TRAILER" && (
              <div className="bg-background rounded-xl border border-border divide-y divide-border/60 overflow-hidden">
                {/* Biển số moóc */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Container className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Biển số rơ-moóc</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-foreground">
                      {item.data.trailerNo}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.data.trailerNo, "biển số moóc")}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Sao chép biển số"
                    >
                      {copiedField === "biển số moóc" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Đơn vị sở hữu */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Đơn vị sở hữu</span>
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    {item.data.vendorName}
                  </div>
                </div>

                {/* Chủng loại moóc */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Chủng loại moóc</span>
                  </div>
                  <div className="text-xs font-medium text-foreground">
                    {item.data.modelType || "Moóc tiêu chuẩn"}
                  </div>
                </div>

                {/* Nhà sản xuất */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Nhà sản xuất</span>
                  </div>
                  <div className="text-xs font-medium text-foreground">
                    {item.data.manufacturer && item.data.manufacturer !== "Unknown"
                      ? item.data.manufacturer
                      : "—"}
                  </div>
                </div>

                {/* Tải trọng chở hàng */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <span className="font-mono text-xs text-slate-500 font-bold">KG</span>
                    <span>Tải trọng chở hàng</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-foreground">
                    {item.data.payloadCapacityTons != null
                      ? `${item.data.payloadCapacityTons} tấn`
                      : "—"}
                  </div>
                </div>

                {/* Tự trọng moóc */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <span className="font-mono text-xs text-slate-500 font-bold">W</span>
                    <span>Tự trọng moóc</span>
                  </div>
                  <div className="text-xs font-mono text-foreground">
                    {item.data.curbWeightTons != null
                      ? `${item.data.curbWeightTons} tấn`
                      : "—"}
                  </div>
                </div>

                {/* Năm sản xuất & Màu sơn */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Năm SX & Màu sơn</span>
                  </div>
                  <div className="text-xs text-foreground">
                    {item.data.productionYear || "—"}{" "}
                    {item.data.paintColor && item.data.paintColor !== "Unknown" && (
                      <span className="text-muted-foreground">
                        • Màu {item.data.paintColor}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tuyến liên vận */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Compass className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Tuyến liên vận</span>
                  </div>
                  <div className="text-xs">
                    {(() => {
                      const b = getTransitRouteBadge(item.data.transitRoute);
                      return (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${b.badgeClass}`}
                        >
                          {b.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Số khung moóc */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Số khung moóc</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-foreground">
                      {item.data.chassisNo || "—"}
                    </span>
                    {item.data.chassisNo && item.data.chassisNo !== "Unknown" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(item.data.chassisNo!, "số khung moóc")
                        }
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Sao chép số khung"
                      >
                        {copiedField === "số khung moóc" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Tình trạng đăng kiểm */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Hạn đăng kiểm</span>
                  </div>
                  <div className="text-xs font-mono">
                    {item.data.inspectionExpirationDate ? (
                      <span className="font-semibold text-foreground">
                        {formatDate(item.data.inspectionExpirationDate)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">
                        {item.data.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ghi chú */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36 pt-0.5">
                    <Tag className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span>Ghi chú nghiệp vụ</span>
                  </div>
                  <div className="text-xs text-foreground italic flex-1">
                    {item.data.notes || (
                      <span className="text-muted-foreground">
                        Không có ghi chú
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. HỒ SƠ TÀI XẾ */}
            {item.type === "DRIVER" && (
              <div className="bg-background rounded-xl border border-border divide-y divide-border/60 overflow-hidden">
                {/* Họ tên & Mã tài xế */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Mã & Họ tên</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {item.data.fullName}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      ({item.data.driverId})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.data.driverId, "mã tài xế")}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Sao chép mã tài xế"
                    >
                      {copiedField === "mã tài xế" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Đơn vị quản lý */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Đội xe trực thuộc</span>
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    {item.data.vendorName}
                  </div>
                </div>

                {/* Điện thoại hotline */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Điện thoại</span>
                  </div>
                  <div className="text-xs">
                    {item.data.phone ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">
                          {item.data.phone}
                        </span>
                        <a
                          href={`tel:${item.data.phone}`}
                          className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          Bấm để gọi
                        </a>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">
                        Chưa có số điện thoại
                      </span>
                    )}
                  </div>
                </div>

                {/* Số GPLX */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <FileCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Số GPLX</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-foreground">
                      {item.data.licenseNo || "—"}
                    </span>
                    {item.data.licenseNo && (
                      <button
                        type="button"
                        onClick={() => handleCopy(item.data.licenseNo!, "số GPLX")}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Sao chép số GPLX"
                      >
                        {copiedField === "số GPLX" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Số CCCD / CMND */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Số CCCD / CMND</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-foreground">
                      {item.data.citizenId || "—"}
                    </span>
                    {item.data.citizenIssueDate && (
                      <span className="text-[11px] text-muted-foreground">
                        (Cấp: {formatDate(item.data.citizenIssueDate)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Hộ chiếu quốc tế (Lào - Cam) */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <FileCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Hộ chiếu liên vận</span>
                  </div>
                  <div className="text-xs">
                    {item.data.passportNo ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">
                          {item.data.passportNo}
                        </span>
                        {item.data.passportIssueDate && (
                          <span className="text-[11px] text-muted-foreground">
                            (Cấp: {formatDate(item.data.passportIssueDate)})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">
                        Chưa nhập hộ chiếu
                      </span>
                    )}
                  </div>
                </div>

                {/* Ngày sinh & Giới tính */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Ngày sinh & Giới tính</span>
                  </div>
                  <div className="text-xs text-foreground">
                    {formatDate(item.data.birthday)} ({item.data.gender || "Nam"})
                  </div>
                </div>

                {/* Quê quán */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36 pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Quê quán / Địa bàn</span>
                  </div>
                  <div className="text-xs text-foreground flex-1 leading-relaxed">
                    {item.data.hometown || (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </div>
                </div>

                {/* Tọa độ GPS */}
                {item.data.gpsCoordinates && (
                  <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                    <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36">
                      <Compass className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      <span>Tọa độ GPS</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-foreground">
                        {item.data.gpsCoordinates}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          item.data.gpsCoordinates
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" /> Bản đồ
                      </a>
                    </div>
                  </div>
                )}

                {/* Ghi chú */}
                <div className="py-2.5 px-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 hover:bg-surface-hover/50 transition-colors">
                  <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 shrink-0 sm:w-36 pt-0.5">
                    <Tag className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span>Ghi chú điều vận</span>
                  </div>
                  <div className="text-xs text-foreground italic flex-1">
                    {item.data.notes || (
                      <span className="text-muted-foreground">
                        Không có ghi chú
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Drawer */}
          <div className="p-4 border-t border-border bg-surface-hover flex items-center justify-between gap-2 shrink-0">
            {onEdit ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit(item);
                  onClose();
                }}
                className="flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5 text-amber-600" />
                <span>Chỉnh sửa hồ sơ</span>
              </Button>
            ) : <div />}

            <Button variant="secondary" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

