"use client";

import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { inputClass } from "./types";

interface QuotationApprovalDialogProps {
  review: "APPROVE" | "REJECT" | "RETURN" | null;
  onClose: () => void;
  comment: string;
  onCommentChange: (val: string) => void;
  error: string;
  busy: boolean;
  onConfirm: () => void;
}

export function QuotationApprovalDialog({
  review,
  onClose,
  comment,
  onCommentChange,
  error,
  busy,
  onConfirm,
}: QuotationApprovalDialogProps) {
  if (!review) return null;

  const isApprove = review === "APPROVE";
  const isReject = review === "REJECT";

  const title = isApprove
    ? "Phê duyệt báo giá"
    : isReject
    ? "Từ chối báo giá"
    : "Trả hồ sơ về bản nháp";

  const description = isApprove
    ? "Phê duyệt sẽ khóa bất biến toàn bộ nội dung thương mại và định mức giá mua của phiên bản này."
    : isReject
    ? "Từ chối báo giá sẽ dừng quy trình duyệt. Người lập có thể xem lý do từ chối để điều chỉnh."
    : "Trả về bản nháp để nhân viên kinh doanh có thể chỉnh sửa lại các thông số và giá cước.";

  const icon = isApprove ? CheckCircle2 : isReject ? XCircle : RotateCcw;

  return (
    <ModalDialog
      open={!!review}
      onOpenChange={(open) => !open && !busy && onClose()}
      size="lg"
      icon={icon}
      title={title}
      description={description}
    >
      <div className="space-y-4 font-sans text-xs">
        <div>
          <label htmlFor="review-comment" className="block font-semibold text-foreground mb-1.5">
            Ý kiến thẩm định / Lý do giải trình{" "}
            {(!isApprove || review === "APPROVE") && (
              <span className="text-muted-foreground font-normal">
                (bắt buộc khi từ chối, trả về nháp hoặc duyệt biên lợi nhuận thấp)
              </span>
            )}
          </label>
          <textarea
            id="review-comment"
            className={`${inputClass} resize-none`}
            maxLength={2000}
            rows={4}
            disabled={busy}
            placeholder="Nhập ý kiến chỉ đạo hoặc lý do thẩm định..."
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant={isReject ? "destructive" : "primary"}
            size="sm"
            loading={busy}
            onClick={onConfirm}
            className="font-semibold"
          >
            {isApprove ? "Xác nhận duyệt" : isReject ? "Xác nhận từ chối" : "Xác nhận trả về"}
          </Button>
        </div>
      </div>
    </ModalDialog>
  );
}

