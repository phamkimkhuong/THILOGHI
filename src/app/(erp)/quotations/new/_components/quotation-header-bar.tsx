"use client";

import Link from "next/link";
import { ArrowLeft, Save, Send, Printer, CopyPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { QuotationDetailResponse } from "@/server/modules/quotation/quotation.service";

interface QuotationHeaderBarProps {
  detail: QuotationDetailResponse | null;
  status: string;
  dirty: boolean;
  canEdit: boolean;
  locked: boolean;
  busy: boolean;
  onSave: (submit: boolean) => void;
  onCreateVersion: () => void;
}

export function QuotationHeaderBar({
  detail,
  status,
  dirty,
  canEdit,
  locked,
  busy,
  onSave,
  onCreateVersion,
}: QuotationHeaderBarProps) {
  const isDraft = status === "DRAFT";
  const isApproved = status === "APPROVED";
  const isSuperseded = status === "SUPERSEDED";

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 font-sans border-b border-border pb-4">
      {/* Tiêu đề & Huy hiệu trạng thái */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <Link
            href="/quotations"
            className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Quay lại Danh sách báo giá"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {detail ? (
              <span>
                {detail.quote.quotationNo}{" "}
                <span className="font-mono text-base font-semibold text-muted-foreground">
                  (Phiên bản {detail.quote.version})
                </span>
              </span>
            ) : (
              "Lập hồ sơ báo giá mới"
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 pl-8.5">
          <StatusBadge status={status} />
          <span
            className={`text-xs font-medium ${
              dirty
                ? "text-amber-600 dark:text-amber-400 font-semibold"
                : detail
                ? "text-muted-foreground"
                : "text-blue-600 dark:text-blue-400"
            }`}
          >
            {dirty ? "• Có thay đổi chưa lưu" : detail ? "• Đã lưu" : "• Bản tạo mới"}
          </span>
        </div>
      </div>

      {/* Nhóm nút tác vụ */}
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/quotations">
          <Button variant="outline" size="sm" className="shadow-xs font-medium">
            Danh sách báo giá
          </Button>
        </Link>

        {isDraft && canEdit && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={locked}
              loading={busy}
              onClick={() => onSave(false)}
              className="flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-muted-foreground" /> Lưu nháp
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={locked}
              loading={busy}
              onClick={() => onSave(true)}
              className="flex items-center gap-1.5 font-bold shadow-xs"
            >
              <Send className="w-3.5 h-3.5" /> Lưu &amp; gửi duyệt
            </Button>
          </>
        )}

        {(isApproved || isSuperseded) && detail && (
          <>
            <Link href={`/quotations/print?id=${detail.quote.quotationId}`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 font-semibold shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" /> Bản in khách hàng
              </Button>
            </Link>

            {canEdit && isApproved && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={busy}
                loading={busy}
                onClick={onCreateVersion}
                className="flex items-center gap-1.5 font-semibold shadow-xs"
              >
                <CopyPlus className="w-3.5 h-3.5" /> Tạo phiên bản mới
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  );
}

