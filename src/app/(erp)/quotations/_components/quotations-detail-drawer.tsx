"use client";

import React from "react";
import Link from "next/link";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import {
  FileText,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Building2,
  DollarSign,
  Layers,
  Lock,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  ArrowRight,
} from "lucide-react";
import { exportQuotationToExcel } from "@/shared/utils/excel";
import { formatVND, type QuotationDetailResponse, type ActionDialogType } from "./types";

interface QuotationsDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  detail: QuotationDetailResponse | null;
  onRetry: () => void;
  onOpenPrint: (quotationId: string) => void;
  onRequestAction: (type: ActionDialogType) => void;
}

export function QuotationsDetailDrawer({
  open,
  onClose,
  loading,
  detail,
  onRetry,
  onOpenPrint,
  onRequestAction,
}: QuotationsDetailDrawerProps) {
  const quote = detail?.quote;

  const handleExportExcel = () => {
    if (!detail) return;
    void exportQuotationToExcel({
      quotationNo: detail.quote.quotationNo,
      version: detail.quote.version,
      customerName: detail.quote.customerName,
      taxCode: detail.quote.taxCode,
      commodity: detail.quote.commodityName,
      paymentTermsDays: detail.quote.paymentTermsDays,
      approvedAt: detail.quote.approvedAt,
      currency: "VND",
      totalSellAmount: detail.quote.totalSellAmount,
      items: detail.items.map((i) => ({
        service: i.servicePackage,
        origin: i.originName || i.originLocationId,
        destination: i.destinationName || i.destinationLocationId,
        equipment: i.equipmentType,
        quantity: Number(i.plannedQuantity),
        unit: i.unit,
        unitPrice: Number(i.unitSellPrice),
        amount: Number(i.totalSellPrice),
        inclusion: i.pricingInclusion,
      })),
    });
  };

  const headerActions = detail ? (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        title="Xuất Báo giá ra file Excel (.xlsx)"
        onClick={handleExportExcel}
        className="px-2.5 py-1 rounded bg-surface border border-border text-foreground hover:bg-surface-hover text-xs font-semibold inline-flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
      </button>
      <Link
        href={`/quotations/new?id=${detail.quote.quotationId}`}
        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50"
      >
        Mở báo giá
      </Link>
    </div>
  ) : null;

  return (
    <ResponsiveDrawer
      open={open}
      onClose={onClose}
      widthClass="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl"
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <span className="font-mono font-bold text-sm text-foreground">
            {quote?.quotationNo || "Chi tiết báo giá"}
          </span>
          {quote && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-surface-hover text-muted-foreground font-mono border border-border">
              v{quote.version}
            </span>
          )}
        </div>
      }
      subtitle="Hồ sơ chi tiết & Phê duyệt thương mại"
      actions={headerActions}
    >
      <div className="flex flex-col h-full text-foreground font-sans">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12 text-muted-foreground text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Đang tải chi tiết báo giá…
          </div>
        ) : !detail || !quote ? (
          <div className="flex-1 p-8 text-center text-muted-foreground text-xs">
            <p role="alert">Không tải được chi tiết báo giá.</p>
            <button
              type="button"
              className="erp-button mt-3 border border-border bg-surface hover:bg-surface-hover cursor-pointer"
              onClick={onRetry}
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Thanh trạng thái nghiệp vụ */}
            <div className="p-3.5 rounded-xl bg-background border border-border flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div>
                <div className="text-xs text-muted-foreground">Trạng thái Hồ Sơ:</div>
                <div className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                  {quote.status === "APPROVED" && (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> ĐÃ PHÊ DUYỆT (IMMUTABLE LOCKED)
                    </span>
                  )}
                  {quote.status === "PENDING_APPROVAL" && (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> CHỜ HỘI ĐỒNG PHÊ DUYỆT
                    </span>
                  )}
                  {quote.status === "DRAFT" && (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Bản nháp (DRAFT)
                    </span>
                  )}
                  {quote.status === "REJECTED" && (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> ĐÃ TỪ CHỐI (REJECTED)
                    </span>
                  )}
                </div>
              </div>

              {quote.status === "APPROVED" && (
                <button
                  type="button"
                  onClick={() => onOpenPrint(quote.quotationId)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Xuất Bảng Giá Khách Hàng
                </button>
              )}
            </div>

            {/* Phân đoạn 1: Khách Hàng & Điều Khoản Thương Mại */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Khách Hàng & Điều Khoản Thương Mại
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-background border border-border text-xs">
                <div>
                  <span className="text-muted-foreground block text-xs">Đơn vị khách hàng:</span>
                  <strong className="text-foreground font-semibold mt-0.5 block">
                    {quote.customerName}
                  </strong>
                  {quote.taxCode && (
                    <span className="text-muted-foreground font-mono text-xs block mt-0.5">
                      MST: {quote.taxCode}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block text-xs">Phân vùng áp dụng:</span>
                  <strong className="text-foreground font-semibold mt-0.5 block">
                    {quote.regionName}
                  </strong>
                  <span className="text-muted-foreground text-xs block mt-0.5">
                    Hạn thanh toán:{" "}
                    <strong className="text-foreground">{quote.paymentTermsDays} ngày</strong>
                  </span>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-muted-foreground block text-xs">Người lập báo giá:</span>
                  <span className="text-foreground font-medium text-xs mt-0.5 block">
                    {quote.createdBy}
                  </span>
                  <span className="text-muted-foreground text-xs font-mono block">
                    Ngày tạo: {new Date(quote.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-muted-foreground block text-xs">
                    Người thẩm định duyệt:
                  </span>
                  <span className="text-foreground font-medium text-xs mt-0.5 block">
                    {quote.approvedBy || "Chưa phê duyệt"}
                  </span>
                  {quote.approvedAt && (
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-mono block">
                      Ngày duyệt: {new Date(quote.approvedAt).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Phân đoạn 2: Ma trận P&L Hiệu Quả Kinh Doanh */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Hiệu Quả Kinh Doanh P&L (Chuẩn VND)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-background border border-border text-center font-mono">
                <div className="p-2 rounded bg-surface border border-border shadow-xs">
                  <span className="text-xs text-muted-foreground block font-sans">
                    Doanh Thu (SELL)
                  </span>
                  <span className="text-xs font-bold text-foreground mt-1 block">
                    {formatVND(quote.totalSellAmount)}
                  </span>
                </div>

                <div className="p-2 rounded bg-surface border border-border shadow-xs">
                  <span className="text-xs text-muted-foreground block font-sans">
                    Giá Vốn (BUY)
                  </span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                    {formatVND(quote.totalEstimatedBuy)}
                  </span>
                </div>

                <div className="p-2 rounded bg-surface border border-border shadow-xs">
                  <span className="text-xs text-muted-foreground block font-sans">Lãi Gộp (GP)</span>
                  <span
                    className={`text-xs font-bold mt-1 block ${
                      quote.estimatedGp >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {formatVND(quote.estimatedGp)}
                  </span>
                </div>

                <div className="p-2 rounded bg-surface border border-border shadow-xs">
                  <span className="text-xs text-muted-foreground block font-sans">
                    Biên Lợi Nhuận
                  </span>
                  <span
                    className={`text-xs font-semibold mt-1 block ${
                      quote.estimatedMarginPercent >= 15
                        ? "text-emerald-600 dark:text-emerald-400 font-bold"
                        : quote.estimatedMarginPercent >= 5
                        ? "text-amber-600 dark:text-amber-400 font-bold"
                        : "text-rose-600 dark:text-rose-400 font-bold"
                    }`}
                  >
                    {quote.estimatedMarginPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Phân đoạn 3: Danh Mục Dịch Vụ Logistics */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Danh Mục Dịch Vụ Logistics ({detail.items.length})
                </span>
                <span className="text-xs text-muted-foreground font-mono">ORDER_SERVICE_ITEMS</span>
              </div>

              <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-hover text-muted-foreground text-xs uppercase border-b border-border">
                      <tr>
                        <th className="py-2 px-3">Dịch Vụ / Tuyến</th>
                        <th className="py-2 px-2 text-center">Thiết Bị</th>
                        <th className="py-2 px-2 text-center">SL</th>
                        <th className="py-2 px-3 text-right">Giá Bán (SELL)</th>
                        <th className="py-2 px-3 text-right">Giá Mua (BUY)</th>
                        <th className="py-2 px-2 text-center">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-sans">
                      {detail.items.map((it, idx) => (
                        <tr
                          key={it.itemId || idx}
                          className="hover:bg-surface-hover transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-foreground">
                              #{idx + 1}. {it.servicePackage}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <span>{it.originName || "Điểm đi"}</span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span>{it.destinationName || "Điểm đến"}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-xs text-primary font-bold">
                            {it.equipmentType}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-xs text-foreground">
                            {it.plannedQuantity} {it.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                            {formatVND(it.totalSellPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                            {formatVND(it.estimatedBuyAmount)}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-xs">
                            <span
                              className={
                                it.itemMarginPercent >= 15
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : it.itemMarginPercent >= 5
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }
                            >
                              {it.itemMarginPercent}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Phân đoạn 4: BUY Snapshot (Thẩm định giá mua NCC nội bộ) */}
            {detail.snapshots.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Giá mua đã lưu · Nội bộ
                  </span>
                  <span className="text-xs text-amber-600/80 dark:text-amber-400/80 font-mono">
                    Chỉ đọc
                  </span>
                </div>

                <div className="space-y-1.5">
                  {detail.snapshots.map((s, sIdx) => (
                    <div
                      key={s.snapshotId || sIdx}
                      className="p-3 rounded-lg bg-background border border-border text-xs flex items-center justify-between shadow-xs"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{s.vendorName}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          Hiệu lực: {s.validityStart} &rarr; {s.validityEnd}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          Đơn giá: {formatVND(s.rateAmountVnd)}
                        </div>
                        {s.originalCurrency !== "VND" && (
                          <div className="text-xs text-muted-foreground font-mono">
                            ({s.rateAmount} {s.originalCurrency} • FX {s.fxRateToVnd})
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phân đoạn 5: Approval Audit Trail */}
            {detail.approvalLogs.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  Nhật Ký Thẩm Định & Phê Duyệt (Audit Trail)
                </div>

                <div className="space-y-1.5">
                  {detail.approvalLogs.map((log) => (
                    <div
                      key={log.logId}
                      className="p-2.5 rounded-lg bg-background border border-border text-xs flex items-start justify-between gap-3 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${
                              log.action === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : log.action === "REJECTED"
                                ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300"
                                : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300"
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="font-semibold text-foreground">
                            {log.actorName || log.actorId}
                          </span>
                        </div>
                        {log.comment && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            &ldquo;{log.comment}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-muted-foreground font-mono block">
                          {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                        {log.snapshotMarginPercent != null && (
                          <span className="text-xs text-muted-foreground font-mono block">
                            Margin: {log.snapshotMarginPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Thanh tác vụ dưới chân Drawer khi trạng thái PENDING_APPROVAL */}
        {detail && quote && quote.status === "PENDING_APPROVAL" && (
          <div className="p-3.5 sm:p-4 border-t border-border bg-surface shrink-0 flex items-center justify-between gap-2">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Chờ thẩm định
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRequestAction("returnToDraft")}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-hover text-foreground text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Trả về nháp
              </button>
              <button
                type="button"
                onClick={() => onRequestAction("reject")}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-600/20 dark:hover:bg-rose-600/30 dark:text-rose-300 dark:border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Từ Chối
              </button>
              <button
                type="button"
                onClick={() => onRequestAction("approve")}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Phê Duyệt
              </button>
            </div>
          </div>
        )}
      </div>
    </ResponsiveDrawer>
  );
}

