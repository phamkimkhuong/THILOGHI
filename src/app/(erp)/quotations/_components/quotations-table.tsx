"use client";

import React from "react";
import Link from "next/link";
import { TableContainer, TableFeedback, Pagination, usePagination } from "@/components/ui/list-page";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusCircle, Printer, ChevronRight, Clock } from "lucide-react";
import { formatVND, STATUS_BADGES, type QuotationListItem } from "./types";

interface QuotationsTableProps {
  quotations: QuotationListItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  selectedQuotationId: string | null;
  isDrawerOpen: boolean;
  onSelectQuotation: (quotationId: string) => void;
  onOpenPrint: (quotationId: string) => void;
  pagination: ReturnType<typeof usePagination>;
}

export function QuotationsTable({
  quotations,
  loading,
  error,
  onRetry,
  selectedQuotationId,
  isDrawerOpen,
  onSelectQuotation,
  onOpenPrint,
  pagination,
}: QuotationsTableProps) {
  const pagedList = quotations.slice(pagination.start, pagination.end);

  return (
    <TableContainer ariaLabel="Bảng danh sách báo giá">
      <table className="erp-table w-full text-left text-xs">
        <thead className="bg-surface-hover border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="py-2.5 px-3">Số Báo Giá</th>
            <th className="py-2.5 px-3">Khách Hàng</th>
            <th className="py-2.5 px-3">Phân Vùng</th>
            <th className="py-2.5 px-3">Tuyến / Thiết Bị</th>
            <th className="py-2.5 px-3 text-right">Doanh Thu (SELL)</th>
            <th className="py-2.5 px-3 text-right">Lãi Gộp (GP)</th>
            <th className="py-2.5 px-3 text-center">Margin %</th>
            <th className="py-2.5 px-3 text-center">Trạng thái</th>
            <th className="py-2.5 px-3">Người Lập</th>
            <th className="py-2.5 px-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border font-sans">
          {loading || error ? (
            <TableFeedback columns={10} loading={loading} error={error} onRetry={onRetry} />
          ) : quotations.length === 0 ? (
            <tr>
              <td colSpan={10} className="p-8">
                <EmptyState
                  title="Không tìm thấy hồ sơ báo giá phù hợp"
                  description="Hãy thử thay đổi từ khóa tìm kiếm hoặc lọc lại theo trạng thái / phân vùng."
                  action={
                    <Link
                      href="/quotations/new"
                      className="erp-button bg-primary text-white hover:bg-primary-hover shadow-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" /> Lập báo giá mới
                    </Link>
                  }
                />
              </td>
            </tr>
          ) : (
            pagedList.map((q) => {
              const badge = STATUS_BADGES[q.status] || {
                label: q.status,
                icon: Clock,
                className: "bg-surface-hover text-muted-foreground border-border",
              };
              const Icon = badge.icon;
              const isSelected = selectedQuotationId === q.quotationId && isDrawerOpen;

              return (
                <tr
                  key={q.quotationId}
                  onClick={() => onSelectQuotation(q.quotationId)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-50/80 hover:bg-blue-100/80 dark:bg-blue-900/20"
                      : "hover:bg-surface-hover"
                  }`}
                >
                  {/* Số Báo Giá */}
                  <td className="py-2.5 px-3 font-mono font-bold text-foreground whitespace-nowrap">
                    <span className="text-primary hover:underline flex items-center gap-1.5 font-bold">
                      {q.quotationNo}
                      <span className="text-xs px-1.5 py-0.5 rounded bg-surface-hover text-muted-foreground font-normal border border-border">
                        v{q.version}
                      </span>
                    </span>
                  </td>

                  {/* Khách Hàng */}
                  <td
                    className="py-2.5 px-3 font-semibold text-foreground max-w-[200px] truncate"
                    title={q.customerName}
                  >
                    {q.customerName}
                  </td>

                  {/* Phân Vùng */}
                  <td className="py-2.5 px-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                    {q.regionName}
                  </td>

                  {/* Tuyến / Thiết Bị */}
                  <td
                    className="py-2.5 px-3 max-w-[190px] truncate text-xs text-muted-foreground"
                    title={q.routeSummary}
                  >
                    {q.routeSummary ? (
                      <div className="flex items-center gap-1 truncate">
                        <span className="truncate text-foreground font-medium">
                          {q.routeSummary}
                        </span>
                        {q.equipmentType && (
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-hover text-primary shrink-0 border border-border">
                            {q.equipmentType}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Chưa chọn tuyến</span>
                    )}
                  </td>

                  {/* Doanh Thu SELL */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                    {formatVND(q.totalSellAmount)}
                  </td>

                  {/* Lãi Gộp GP */}
                  <td
                    className={`py-2.5 px-3 text-right font-mono font-semibold whitespace-nowrap ${
                      q.estimatedGp >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {formatVND(q.estimatedGp)}
                  </td>

                  {/* Margin % */}
                  <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                        q.estimatedMarginPercent >= 15
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                          : q.estimatedMarginPercent >= 5
                          ? "text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20"
                          : "text-rose-700 bg-rose-50 border border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20"
                      }`}
                    >
                      {q.estimatedMarginPercent}%
                    </span>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
                    >
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </span>
                  </td>

                  {/* Người Lập */}
                  <td
                    className="py-2.5 px-3 text-muted-foreground text-xs truncate max-w-[130px]"
                    title={q.createdBy}
                  >
                    {q.createdBy}
                  </td>

                  {/* Thao tác */}
                  <td
                    className="py-2.5 px-3 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      {q.status === "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => onOpenPrint(q.quotationId)}
                          className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-600/15 dark:hover:bg-emerald-600/25 dark:text-emerald-300 dark:border-emerald-500/30 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title="Xuất bảng chào giá thương mại cho khách hàng"
                        >
                          <Printer className="w-3 h-3" />
                          Bản in
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectQuotation(q.quotationId)}
                        className="px-2.5 py-1 rounded bg-surface border border-border hover:bg-surface-hover text-foreground text-xs font-medium flex items-center gap-0.5 transition-colors shadow-xs cursor-pointer"
                      >
                        Chi tiết <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <Pagination
        pagination={pagination}
        loading={loading}
        error={Boolean(error)}
        loaded={quotations.length}
        limit={250}
      />
    </TableContainer>
  );
}

