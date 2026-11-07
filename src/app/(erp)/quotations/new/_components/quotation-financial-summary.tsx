"use client";

import { PieChart, AlertCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { calculateQuotationFinancials } from "@/shared/utils/pricing";
import type { evaluateApprovalAuthority } from "@/features/quotation/approval-policy";
import { money, panelClass } from "./types";

interface QuotationFinancialSummaryProps {
  totals: ReturnType<typeof calculateQuotationFinancials>;
  missingCount: number;
  status: string;
  authority: ReturnType<typeof evaluateApprovalAuthority>;
}

export function QuotationFinancialSummary({
  totals,
  missingCount,
  status,
  authority,
}: QuotationFinancialSummaryProps) {
  const isDraft = status === "DRAFT";
  const hasMissing = missingCount > 0 && isDraft;

  return (
    <aside className={`${panelClass} self-start lg:sticky lg:top-4 font-sans`}>
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-900">
          <PieChart className="w-4 h-4" />
        </span>
        <h2 className="text-base font-bold text-foreground">3. Tổng hợp tài chính nội bộ</h2>
      </div>

      {hasMissing && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {missingCount} dòng dịch vụ đang thiếu giá mua NCC hợp lệ. Chi phí và lợi nhuận chưa thể
            tính toán đầy đủ.
          </span>
        </div>
      )}

      {/* Danh sách các chỉ số tài chính */}
      <div className="space-y-3 divide-y divide-border/60 text-xs">
        {/* Doanh thu */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-muted-foreground">Tổng doanh thu bán</span>
          <span className="font-mono text-base font-bold text-foreground">
            {money(totals.totalSellAmount)}
          </span>
        </div>

        {/* Chi phí dự kiến */}
        <div className="pt-3 flex items-center justify-between">
          <span className="text-muted-foreground">Chi phí mua dự kiến</span>
          <span className="font-mono text-sm font-semibold text-foreground">
            {money(totals.totalEstimatedBuy)}
          </span>
        </div>

        {/* Chi phí cao nhất */}
        <div className="pt-3 flex items-center justify-between">
          <span className="text-muted-foreground">Chi phí cao nhất (Worst case)</span>
          <span className="font-mono text-xs text-muted-foreground">
            {money(totals.totalWorstCaseBuy)}
          </span>
        </div>

        {/* Lợi nhuận dự kiến */}
        <div className="pt-3 flex items-center justify-between">
          <span className="text-muted-foreground font-semibold">Lợi nhuận gộp (GP)</span>
          <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {hasMissing ? "Chưa đủ dữ liệu" : money(totals.estimatedGp)}
          </span>
        </div>

        {/* Biên lợi nhuận */}
        <div className="pt-3 flex items-center justify-between">
          <span className="text-muted-foreground font-semibold">Biên lợi nhuận (Margin)</span>
          <span
            className={`font-mono text-base font-extrabold ${
              hasMissing
                ? "text-muted-foreground text-xs"
                : totals.estimatedMarginPercent >= 15
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {hasMissing ? "Chưa đủ dữ liệu" : `${totals.estimatedMarginPercent.toFixed(2)}%`}
          </span>
        </div>
      </div>

      {/* Cấp thẩm quyền phê duyệt */}
      <div className="p-3 rounded-xl bg-background border border-border space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          {authority.isBodEscalation ? (
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
          )}
          <span>Thẩm quyền phê duyệt:</span>
        </div>
        <p className="text-xs text-muted-foreground pl-5.5">
          {authority.requiredRole === "DIRECTOR"
            ? "Giám đốc / Ban Tổng Giám đốc (BOD)"
            : "Trưởng phòng định giá (Pricing Manager)"}
          {authority.isBodEscalation && (
            <span className="block text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              ⚠️ Ngoại lệ biên lợi nhuận thấp (&lt; 15%), yêu cầu giải trình lý do duyệt.
            </span>
          )}
        </p>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        * Tổng giá trị bao gồm các dòng tạm tính. Đơn giá thực tế sẽ được kiểm tra và khóa bất biến
        khi lưu và gửi duyệt.
      </p>
    </aside>
  );
}

