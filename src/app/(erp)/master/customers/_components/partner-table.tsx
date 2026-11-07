"use client";

import {
  Users,
  MapPin,
  Phone,
  User,
  Eye,
  Pencil,
  SlidersHorizontal,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableContainer, TableFeedback, Pagination, usePagination } from "@/components/ui/list-page";
import {
  PARTNER_TYPE_BADGES,
  getCountryBadge,
  type PartnerDirectoryItem,
} from "./types";

interface PartnerTableProps {
  partners: PartnerDirectoryItem[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onViewPartner: (partner: PartnerDirectoryItem) => void;
  onEditPartner: (partner: PartnerDirectoryItem) => void;
  filterKey: string;
}

export function PartnerTable({
  partners,
  loading,
  loadError,
  onRetry,
  onViewPartner,
  onEditPartner,
  filterKey,
}: PartnerTableProps) {
  const pagination = usePagination(partners.length, filterKey);

  return (
    <div className="space-y-2 font-sans">
      <TableContainer ariaLabel="Bảng dữ liệu danh bạ đối tác THILOGI">
        <table className="erp-table w-full text-left text-xs text-foreground">
          <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2.5 px-3 whitespace-nowrap">Mã & Tên Ngắn</th>
              <th className="py-2.5 px-3 min-w-[220px]">Tên Pháp Nhân Đầy Đủ</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Phân Nhóm Đối Tác</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Quốc Gia</th>
              <th className="py-2.5 px-3 min-w-[200px]">Địa Chỉ & Tọa Độ GPS</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Đại Diện & Liên Hệ</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Mã Số Thuế</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Trạng Thái</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-sans">
            {loading || loadError ? (
              <TableFeedback columns={9} loading={loading} error={loadError} onRetry={onRetry} />
            ) : partners.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8">
                  <EmptyState
                    icon={Users}
                    title="Không tìm thấy đối tác phù hợp"
                    description="Hãy thử thay đổi từ khóa tìm kiếm hoặc lọc lại theo phân nhóm / quốc gia / trạng thái."
                  />
                </td>
              </tr>
            ) : (
              partners.slice(pagination.start, pagination.end).map((p) => {
                const typeBadge = PARTNER_TYPE_BADGES[p.sourcePartnerType || ""] || {
                  label: p.sourcePartnerType || "Khác",
                  badgeClass: "bg-surface text-muted-foreground border-border",
                };
                const countryBadge = getCountryBadge(p.country);

                return (
                  <tr
                    key={p.partnerId}
                    onClick={() => onViewPartner(p)}
                    className="hover:bg-surface-hover cursor-pointer transition-colors"
                  >
                    {/* Cột 1: Mã & Tên ngắn */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-bold text-foreground text-xs">
                        {p.shortName || p.partnerId}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {p.partnerId}
                      </div>
                    </td>

                    {/* Cột 2: Tên pháp nhân */}
                    <td className="py-2.5 px-3 min-w-[220px] max-w-[320px]">
                      <div className="font-semibold text-foreground text-xs truncate" title={p.partnerName}>
                        {p.partnerName}
                      </div>
                      {p.email && (
                        <div className="text-[11px] text-muted-foreground truncate" title={p.email}>
                          {p.email}
                        </div>
                      )}
                    </td>

                    {/* Cột 3: Phân nhóm đối tác */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold border ${typeBadge.badgeClass}`}
                      >
                        {typeBadge.label}
                      </span>
                    </td>

                    {/* Cột 4: Quốc gia */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <span>{countryBadge.flag}</span>
                        <span>{countryBadge.name}</span>
                      </span>
                    </td>

                    {/* Cột 5: Địa chỉ & Tọa độ GPS */}
                    <td className="py-2.5 px-3 min-w-[200px] max-w-[260px]">
                      <div className="flex items-start gap-1.5">
                        {p.gpsCoordinates ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              p.gpsCoordinates
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 mt-0.5 shrink-0"
                            title={`Xem tọa độ GPS trên bản đồ: ${p.gpsCoordinates}`}
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                        )}
                        <span
                          className="text-xs text-muted-foreground truncate"
                          title={p.address || "Chưa cập nhật địa chỉ"}
                        >
                          {p.address || "-"}
                        </span>
                      </div>
                    </td>

                    {/* Cột 6: Đại diện & Liên hệ */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {p.representedBy && (
                        <div className="font-medium text-foreground text-xs flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[140px]" title={p.representedBy}>
                            {p.representedBy}
                          </span>
                        </div>
                      )}
                      {p.phone && p.phone !== "Wait" ? (
                        <a
                          href={`tel:${p.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{p.phone}</span>
                        </a>
                      ) : (
                        !p.representedBy && <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>

                    {/* Cột 7: Mã số thuế */}
                    <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {p.taxCode || "-"}
                    </td>

                    {/* Cột 8: Trạng thái */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <StatusBadge status={p.status || "ACTIVE"} />
                    </td>

                    {/* Cột 9: Thao tác */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Nút Xem chi tiết */}
                        <button
                          type="button"
                          onClick={() => onViewPartner(p)}
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-muted-foreground transition-colors cursor-pointer"
                          title="Xem hồ sơ đối tác"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Nút Sửa hồ sơ */}
                        <button
                          type="button"
                          onClick={() => onEditPartner(p)}
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 text-muted-foreground transition-colors cursor-pointer"
                          title="Chỉnh sửa thông tin đối tác"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Nút Quản trị Vai trò & Hạn mức */}
                        <button
                          type="button"
                          onClick={() => onViewPartner(p)}
                          className="px-2 py-1 rounded-lg bg-surface border border-border hover:bg-surface-hover text-foreground text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Quản trị vai trò & Hạn mức nợ"
                        >
                          <SlidersHorizontal className="w-3 h-3 text-purple-600" />
                          <span>Role</span>
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

      {/* Phân trang chuẩn */}
      <Pagination
        pagination={pagination}
        loading={loading}
        error={!!loadError}
        loaded={partners.length}
        limit={200}
      />
    </div>
  );
}
