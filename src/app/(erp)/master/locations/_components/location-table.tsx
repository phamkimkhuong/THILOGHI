"use client";

import { useState } from "react";
import {
  MapPin,
  Anchor,
  Layers,
  Warehouse,
  Factory,
  Building2,
  Compass,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableFeedback, Pagination, usePagination, TableContainer } from "@/components/ui/list-page";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { COUNTRY_CONFIG, type LocationRecord, type RegionRecord } from "./types";

interface LocationTableProps {
  locations: LocationRecord[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onView: (location: LocationRecord) => void;
  onEdit: (location: LocationRecord) => void;
  onToggle: (location: LocationRecord) => void;
  onDelete: (location: LocationRecord) => void;
  filterKey: string;
  totalOriginal: number;
  searchTerm: string;
  regionFilter: string;
  regions: RegionRecord[];
  crossRegionMatches: LocationRecord[];
  onResetFilters: () => void;
}

export function LocationTable({
  locations,
  loading,
  loadError,
  onRetry,
  onView,
  onEdit,
  onToggle,
  onDelete,
  filterKey,
  totalOriginal,
  searchTerm,
  regionFilter,
  regions,
  crossRegionMatches,
  onResetFilters,
}: LocationTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pagination = usePagination(locations.length, filterKey);

  const handleCopyGps = (gps: string, id: string) => {
    navigator.clipboard.writeText(gps);
    setCopiedId(id);
    toast.success(`Đã sao chép tọa độ: ${gps}`);
    setTimeout(() => setCopiedId(null), 2000);
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

  const currentRegionName = regions.find((r) => r.id === regionFilter)?.name || regionFilter;

  return (
    <div className="space-y-2">
      <TableContainer ariaLabel="Bảng quản lý địa điểm">
        <table className="erp-table w-full text-left text-xs text-foreground">
          <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2.5 px-3">Mã & Quốc gia</th>
              <th className="py-2.5 px-3">Tên địa điểm</th>
              <th className="py-2.5 px-3">Phân loại</th>
              <th className="py-2.5 px-3">Đơn vị / Pháp nhân</th>
              <th className="py-2.5 px-3">Tỉnh / Thành & Vùng</th>
              <th className="py-2.5 px-3">Tọa độ GPS</th>
              <th className="py-2.5 px-3">Địa chỉ</th>
              <th className="py-2.5 px-3 text-center">Trạng thái</th>
              <th className="py-2.5 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-sans">
            {loading || loadError ? (
              <TableFeedback columns={9} loading={loading} error={loadError} onRetry={onRetry} />
            ) : locations.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8">
                  {crossRegionMatches.length > 0 ? (
                    <EmptyState
                      icon={MapPin}
                      title={`Tìm thấy ${crossRegionMatches.length} địa điểm khớp với "${searchTerm}" ở phân vùng khác`}
                      description={`Các địa điểm này thuộc phân vùng [${regions.find((r) => r.id === crossRegionMatches[0]?.regionId)?.name || crossRegionMatches[0]?.regionId}] do bạn đang chọn lọc theo [${currentRegionName}].`}
                      action={
                        <Button variant="primary" size="sm" onClick={onResetFilters}>
                          Xem tất cả {crossRegionMatches.length} địa điểm (Bỏ lọc phân vùng)
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={MapPin}
                      title="Không tìm thấy địa điểm phù hợp"
                      description="Hãy thử đổi từ khóa tìm kiếm hoặc bấm 'Bỏ lọc' để quay lại danh sách toàn bộ địa điểm."
                      action={
                        <Button variant="primary" size="sm" onClick={onResetFilters}>
                          Hiển thị tất cả địa điểm
                        </Button>
                      }
                    />
                  )}
                </td>
              </tr>
            ) : (
              locations.slice(pagination.start, pagination.end).map((l) => {
                const countryCfg = COUNTRY_CONFIG[l.countryCode?.toUpperCase() || ""] || {
                  name: l.countryCode || "Khác",
                  flag: "📍",
                  badgeClass: "bg-surface border-border text-foreground",
                };
                return (
                  <tr
                    key={l.locationId}
                    onClick={() => onView(l)}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
                  >
                    {/* Cột 1: Mã code & Quốc gia */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-surface text-muted-foreground font-mono text-[11px] font-medium"
                          title={countryCfg.name}
                        >
                          {l.countryCode || "-"}
                        </span>
                        <span className="font-mono font-semibold text-foreground text-xs">
                          {l.code}
                        </span>
                      </div>
                    </td>

                    {/* Cột 2: Tên địa điểm */}
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-surface border border-border shrink-0">
                          {getTypeIcon(l.locationType)}
                        </span>
                        <span className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                          {l.name}
                        </span>
                      </div>
                    </td>

                    {/* Cột 3: Phân loại */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-surface border border-border font-medium text-muted-foreground">
                        {l.locationType}
                      </span>
                    </td>

                    {/* Cột 4: Đơn vị / Pháp nhân & Liên hệ */}
                    <td className="py-2.5 px-3">
                      {l.company ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
                          <Building2 className="w-3 h-3" />
                          {l.company}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                      {l.contact && (
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 flex items-center gap-1 font-medium">
                          <Phone className="w-2.5 h-2.5 shrink-0" />
                          <span>{l.contact}</span>
                        </div>
                      )}
                      {l.note && (
                        <div className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px] mt-0.5" title={l.note}>
                          {l.note}
                        </div>
                      )}
                    </td>

                    {/* Cột 5: Tỉnh/Thành & Phân vùng */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-foreground">{l.province || "-"}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {l.regionName || l.regionId || "-"}
                      </div>
                    </td>

                    {/* Cột 6: Tọa độ GPS */}
                    <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {l.gpsCoordinates ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.gpsCoordinates)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-foreground hover:text-blue-600 bg-surface px-1.5 py-0.5 rounded border border-border transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                            title="Mở Google Maps"
                          >
                            <Compass className="w-3 h-3 text-muted-foreground" />
                            <span>{l.gpsCoordinates.length > 18 ? `${l.gpsCoordinates.substring(0, 18)}…` : l.gpsCoordinates}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyGps(l.gpsCoordinates!, l.locationId)}
                            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-surface-hover transition-colors"
                            title="Sao chép tọa độ"
                          >
                            {copiedId === l.locationId ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px] italic">Chưa có GPS</span>
                      )}
                    </td>

                    {/* Cột 7: Địa chỉ */}
                    <td className="py-2.5 px-3 text-muted-foreground text-xs max-w-[200px] truncate" title={l.address}>
                      {l.address || "-"}
                    </td>

                    {/* Cột 8: Trạng thái */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <StatusBadge status={l.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>

                    {/* Cột 9: Thao tác Thêm / Sửa / Xóa */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* Nút Xem chi tiết */}
                        <button
                          type="button"
                          onClick={() => onView(l)}
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
                          title="Xem chi tiết địa điểm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Nút Sửa địa điểm */}
                        <button
                          type="button"
                          onClick={() => onEdit(l)}
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/40 text-muted-foreground transition-colors"
                          title="Chỉnh sửa thông tin địa điểm"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Nút Đổi trạng thái (Bật/Tắt hoạt động) */}
                        <button
                          type="button"
                          onClick={() => onToggle(l)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            l.isActive
                              ? "border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
                              : "border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                          }`}
                          title={l.isActive ? "Tạm dừng hoạt động địa điểm này" : "Kích hoạt lại địa điểm này"}
                        >
                          {l.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                        </button>

                        {/* Nút Xóa địa điểm */}
                        <button
                          type="button"
                          onClick={() => onDelete(l)}
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/40 text-muted-foreground transition-colors"
                          title="Xóa địa điểm"
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
        limit={500}
        sizeOptions={[25, 50, 100, 200]}
      />
    </div>
  );
}

