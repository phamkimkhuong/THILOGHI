"use client";

import { useState } from "react";
import {
  X,
  Building2,
  Compass,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  Calendar,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Anchor,
  Layers,
  Warehouse,
  Factory,
  Phone,
  Package,
  FileText,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/shared/utils/clipboard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { COUNTRY_CONFIG, type LocationRecord } from "./types";

interface LocationDetailDrawerProps {
  location: LocationRecord | null;
  onClose: () => void;
  onEdit: (location: LocationRecord) => void;
  onToggle: (location: LocationRecord) => void;
  onDelete: (location: LocationRecord) => void;
}

export function LocationDetailDrawer({
  location,
  onClose,
  onEdit,
  onToggle,
  onDelete,
}: LocationDetailDrawerProps) {
  const [copiedGps, setCopiedGps] = useState(false);

  if (!location) return null;

  const handleCopyGps = (gps: string) => {
    void copyToClipboard(gps);
    setCopiedGps(true);
    toast.success(`Đã sao chép tọa độ: ${gps}`);
    setTimeout(() => setCopiedGps(false), 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "PORT":
        return <Anchor className="w-4 h-4 text-blue-500" />;
      case "BORDER":
      case "BORDER_GATE":
        return <Layers className="w-4 h-4 text-amber-500" />;
      case "WAREHOUSE":
      case "DEPOT":
      case "ICD":
        return <Warehouse className="w-4 h-4 text-emerald-500" />;
      case "STUFFING PLACE":
      case "INDUSTRIAL_ZONE":
        return <Factory className="w-4 h-4 text-indigo-500" />;
      default:
        return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const countryCfg = COUNTRY_CONFIG[location.countryCode?.toUpperCase() || ""] || {
    name: location.countryCode || "Không xác định",
    flag: "📍",
    badgeClass: "bg-surface border-border text-foreground",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md md:max-w-lg bg-surface border-l border-border h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header Drawer */}
        <div className="p-4 border-b border-border flex items-start justify-between bg-surface-hover">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-surface border border-border text-foreground">
                {getTypeIcon(location.locationType)}
              </span>
              <span className="font-mono text-xs font-semibold text-foreground bg-surface px-2 py-0.5 rounded border border-border">
                {location.code}
              </span>
              <StatusBadge status={location.isActive ? "ACTIVE" : "INACTIVE"} />
            </div>
            <h2 id="drawer-title" className="text-base font-bold text-foreground leading-snug">
              {location.name}
            </h2>
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
          {/* Thẻ Quốc gia & Vùng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-muted-foreground text-[11px] block">Quốc gia</span>
              <div className="mt-1 flex items-center gap-1.5 font-semibold text-foreground text-sm">
                <span>{countryCfg.flag}</span>
                <span>{countryCfg.name}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-muted-foreground text-[11px] block">Phân vùng Logistics</span>
              <div className="mt-1 font-semibold text-foreground text-sm">
                {location.regionName || location.regionId || "Chưa gán"}
              </div>
            </div>
          </div>

          {/* Thông tin Cơ sở & Đơn vị */}
          <div className="p-3.5 rounded-xl bg-background border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" /> Thông tin cơ sở & Quản lý
            </h3>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <span className="text-muted-foreground text-[11px]">Loại hình:</span>
                <p className="font-medium text-foreground mt-0.5">{location.locationType}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Đơn vị / Pháp nhân:</span>
                <p className="font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {location.company || "THILOGI Logistics"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Tỉnh / Thành phố:</span>
                <p className="font-medium text-foreground mt-0.5">{location.province || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Mã hệ thống (ID):</span>
                <p className="font-mono text-muted-foreground mt-0.5">{location.locationId}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60">
              <span className="text-muted-foreground text-[11px]">Địa chỉ chi tiết:</span>
              <p className="text-foreground font-medium mt-0.5">{location.address || "Chưa cập nhật địa chỉ chi tiết"}</p>
            </div>

            {/* Thông tin liên hệ kho */}
            {location.contact && (
              <div className="pt-2 border-t border-border/60">
                <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" /> Người liên hệ / Hotline:
                </span>
                <p className="text-emerald-700 dark:text-emerald-400 font-bold mt-0.5 font-mono text-xs">
                  {location.contact}
                </p>
              </div>
            )}

            {/* Mặt hàng phụ trách */}
            {location.commodities && (
              <div className="pt-2 border-t border-border/60">
                <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                  <Package className="w-3 h-3 text-amber-600" /> Mặt hàng tiếp nhận:
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium">
                    {location.commodities}
                  </span>
                </div>
              </div>
            )}

            {/* Ghi chú nghiệp vụ / Tên pháp nhân */}
            {location.note && (
              <div className="pt-2 border-t border-border/60">
                <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                  <FileText className="w-3 h-3 text-blue-600" /> Ghi chú nghiệp vụ / Pháp nhân:
                </span>
                <p className="text-foreground text-xs mt-0.5 bg-surface p-2 rounded-lg border border-border leading-relaxed">
                  {location.note}
                </p>
              </div>
            )}
          </div>

          {/* Tọa độ vệ tinh GPS & Dẫn đường Google Maps */}
          <div className="p-3.5 rounded-xl bg-background border border-border space-y-2.5">
            <h3 className="font-semibold text-foreground text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-600" /> Tọa độ vệ tinh GPS
              </span>
              {location.gpsCoordinates && (
                <span className="text-[11px] text-emerald-600 font-normal">Sẵn sàng điều độ</span>
              )}
            </h3>

            {location.gpsCoordinates ? (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between font-mono text-xs">
                  <span className="text-blue-700 dark:text-blue-300 font-semibold">
                    {location.gpsCoordinates}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyGps(location.gpsCoordinates!)}
                      className="px-2 py-1 rounded bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground border border-border flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedGps ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedGps ? "Đã chép" : "Chép"}</span>
                    </button>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.gpsCoordinates)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Mở trực tiếp trên Google Maps
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-surface border border-border text-center text-muted-foreground">
                <MapPin className="w-6 h-6 mx-auto mb-1 opacity-40" />
                Chưa cập nhật tọa độ GPS vệ tinh cho địa điểm này.
              </div>
            )}
          </div>

          {/* Thông tin khởi tạo & Audit */}
          <div className="p-3 rounded-xl bg-background border border-border space-y-1 text-muted-foreground text-[11px]">
            {location.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Bản ghi tạo lúc: {new Date(location.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
            )}
            {location.createdBy && (
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                <span>
                  Người tạo: <strong className="text-foreground">{location.createdBy}</strong>
                </span>
              </div>
            )}
            {location.updatedBy && (
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>
                  Cập nhật lần cuối: <strong className="text-foreground">{location.updatedBy}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Drawer: Thao tác Quản trị Địa điểm */}
        <div className="p-4 border-t border-border bg-surface-hover space-y-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Thao tác Quản lý
          </span>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onEdit(location)}
              className="flex items-center justify-center gap-1 text-xs"
            >
              <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
            </Button>

            <Button
              variant={location.isActive ? "outline" : "secondary"}
              size="sm"
              onClick={() => onToggle(location)}
              className="flex items-center justify-center gap-1 text-xs"
            >
              {location.isActive ? (
                <>
                  <PowerOff className="w-3.5 h-3.5 text-amber-600" /> Tạm dừng
                </>
              ) : (
                <>
                  <Power className="w-3.5 h-3.5 text-emerald-600" /> Kích hoạt
                </>
              )}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(location)}
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

