"use client";

import {
  Users,
  Phone,
  Eye,
  Pencil,
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

function isValidPhone(phone?: string): boolean {
  if (!phone) return false;
  const p = phone.trim().toLowerCase();
  return p !== "" && p !== "update" && p !== "wait" && p !== "null" && p !== "undefined";
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
              <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">Mã & Tên Ngắn</th>
              <th className="py-2.5 px-3 min-w-[260px]">Tên Pháp Nhân Công Ty</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Phân Nhóm</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Quốc Gia</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Hotline / SĐT</th>
              <th className="py-2.5 px-3 text-center whitespace-nowrap">Trạng Thái</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 font-sans">
            {loading || loadError ? (
              <TableFeedback columns={7} loading={loading} error={loadError} onRetry={onRetry} />
            ) : partners.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8">
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
                    <td className="py-2.5 px-3 min-w-[260px] max-w-[380px]">
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

                    {/* Cột 5: Hotline / SĐT liên hệ nhanh */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isValidPhone(p.phone) ? (
                        <a
                          href={`tel:${p.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          title={`Bấm để gọi: ${p.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{p.phone}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs">-</span>
                      )}
                    </td>

                    {/* Cột 6: Trạng thái */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <StatusBadge status={p.status || "ACTIVE"} />
                    </td>

                    {/* Cột 7: Thao tác */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Nút Xem chi tiết */}
                        <button
                          type="button"
                          onClick={() => onViewPartner(p)}
                          className="p-1.5 rounded-lg border border-border bg-surface hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-muted-foreground transition-colors cursor-pointer"
                          title="Xem chi tiết hồ sơ đối tác"
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
