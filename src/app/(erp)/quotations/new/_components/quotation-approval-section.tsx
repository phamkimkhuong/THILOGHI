"use client";

import { CheckCircle2, XCircle, RotateCcw, History, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuotationDetailResponse } from "@/server/modules/quotation/quotation.service";
import type { evaluateApprovalAuthority } from "@/features/quotation/approval-policy";
import { panelClass } from "./types";

interface QuotationApprovalSectionProps {
  detail: QuotationDetailResponse;
  status: string;
  ownQuote: boolean;
  authority: ReturnType<typeof evaluateApprovalAuthority>;
  manager: boolean;
  busy: boolean;
  onStartReview: (action: "APPROVE" | "REJECT" | "RETURN") => void;
}

export function QuotationApprovalSection({
  detail,
  status,
  ownQuote,
  authority,
  manager,
  busy,
  onStartReview,
}: QuotationApprovalSectionProps) {
  const isPendingApproval = status === "PENDING_APPROVAL";

  return (
    <section className={panelClass}>
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="p-1.5 rounded-lg bg-blue-500/10 text-primary border border-blue-200 dark:border-blue-900">
          <History className="w-4 h-4" />
        </span>
        <h2 className="text-base font-bold text-foreground">Thẩm định phê duyệt &amp; Lịch sử</h2>
      </div>

      {/* Cảnh báo Separation of duties */}
      {ownQuote && isPendingApproval && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            Quy định phân quyền: Người lập báo giá không được phép tự phê duyệt hồ sơ của chính mình.
          </span>
        </div>
      )}

      {/* Lý do không đủ thẩm quyền */}
      {isPendingApproval && !authority.allowed && (
        <p className="text-xs text-muted-foreground italic pl-1">{authority.reason}</p>
      )}

      {/* Nút hành động thẩm định */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {isPendingApproval && (
          <>
            {authority.allowed && !ownQuote && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={busy}
                onClick={() => onStartReview("APPROVE")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Duyệt báo giá
              </Button>
            )}

            {manager && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={() => onStartReview("REJECT")}
                className="flex items-center gap-1.5 font-semibold"
              >
                <XCircle className="w-4 h-4" /> Từ chối báo giá
              </Button>
            )}
          </>
        )}

        {manager && (isPendingApproval || status === "REJECTED") && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => onStartReview("RETURN")}
            className="flex items-center gap-1.5 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Trả về bản nháp
          </Button>
        )}
      </div>

      {/* Lịch sử thẩm định */}
      <div className="pt-3 border-t border-border space-y-2.5">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Nhật ký phê duyệt (Audit Trail)
        </h3>
        {detail.approvalLogs.length > 0 ? (
          <ol className="space-y-3 pl-1">
            {detail.approvalLogs.map((log) => (
              <li
                key={log.logId}
                className="border-l-2 border-primary/40 pl-3.5 space-y-0.5 text-xs font-sans"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{log.action}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-foreground">{log.actorName ?? log.actorId}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-mono text-[11px] text-muted-foreground bg-surface px-1.5 py-0.2 rounded border border-border">
                    v{log.version}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString("vi-VN")}
                  {log.comment && (
                    <span className="text-foreground block mt-0.5 italic">
                      &ldquo;{log.comment}&rdquo;
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-muted-foreground italic">Chưa có sự kiện thẩm định nào.</p>
        )}
      </div>
    </section>
  );
}

