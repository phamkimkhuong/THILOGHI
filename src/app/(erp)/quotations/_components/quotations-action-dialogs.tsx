"use client";

import React, { useState, useTransition } from "react";
import { CheckCircle2, XCircle, RotateCcw, AlertTriangle } from "lucide-react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  approveQuotationAction,
  rejectQuotationAction,
  returnQuotationToDraftAction,
} from "@/features/quotation/actions";
import type { ActionDialogState } from "./types";

interface QuotationsActionDialogsProps {
  state: ActionDialogState | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuotationsActionDialogs({
  state,
  onClose,
  onSuccess,
}: QuotationsActionDialogsProps) {
  const [comment, setComment] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!state) return null;

  const { type, quotationId, quotationNo, margin = 0 } = state;
  const isExceptionApproval = type === "approve" && margin < 15;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = comment.trim();

    if (type === "approve") {
      if (isExceptionApproval && trimmed.length < 5) {
        setValidationError("Bắt buộc nhập lý do phê duyệt ngoại lệ (tối thiểu 5 ký tự).");
        return;
      }

      startTransition(async () => {
        try {
          const res = await approveQuotationAction(quotationId, trimmed || undefined);
          if (res.success) {
            toast.success(res.message || `Đã phê duyệt báo giá [${quotationNo}] thành công.`);
            onSuccess();
            onClose();
          } else {
            toast.error(res.error || "Lỗi khi phê duyệt báo giá.");
          }
        } catch {
          toast.error("Lỗi kết nối khi gửi yêu cầu phê duyệt.");
        }
      });
    } else if (type === "reject") {
      if (!trimmed) {
        setValidationError("Vui lòng nhập lý do từ chối báo giá.");
        return;
      }

      startTransition(async () => {
        try {
          const res = await rejectQuotationAction(quotationId, trimmed);
          if (res.success) {
            toast.success(res.message || `Đã từ chối báo giá [${quotationNo}].`);
            onSuccess();
            onClose();
          } else {
            toast.error(res.error || "Lỗi khi từ chối báo giá.");
          }
        } catch {
          toast.error("Lỗi kết nối khi từ chối báo giá.");
        }
      });
    } else if (type === "returnToDraft") {
      if (!trimmed) {
        setValidationError("Vui lòng nhập ý kiến yêu cầu chỉnh sửa lại báo giá.");
        return;
      }

      startTransition(async () => {
        try {
          const res = await returnQuotationToDraftAction(quotationId, trimmed);
          if (res.success) {
            toast.success(res.message || `Đã trả báo giá [${quotationNo}] về bản nháp.`);
            onSuccess();
            onClose();
          } else {
            toast.error(res.error || "Lỗi khi trả báo giá về bản nháp.");
          }
        } catch {
          toast.error("Lỗi kết nối khi trả về bản nháp.");
        }
      });
    }
  };

  const getDialogConfig = () => {
    switch (type) {
      case "approve":
        return {
          title: `Phê duyệt Báo giá [${quotationNo}]`,
          icon: CheckCircle2,
          description: isExceptionApproval
            ? `Cảnh báo: Biên lợi nhuận (${margin}%) thấp hơn chuẩn 15%. Thao tác này sẽ ghi nhận phê duyệt ngoại lệ.`
            : `Xác nhận phê duyệt và phát hành báo giá với biên lợi nhuận ${margin}%.`,
          buttonLabel: "Xác nhận Phê duyệt",
          buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
          textareaPlaceholder: isExceptionApproval
            ? "Nhập lý do phê duyệt ngoại lệ (tối thiểu 5 ký tự)..."
            : "Ghi chú phê duyệt (tùy chọn)...",
          textareaLabel: isExceptionApproval ? "Lý do phê duyệt ngoại lệ *" : "Ghi chú thẩm định",
        };
      case "reject":
        return {
          title: `Từ chối Báo giá [${quotationNo}]`,
          icon: XCircle,
          description: "Hồ sơ báo giá sẽ bị từ chối và thông báo lý do đến người lập.",
          buttonLabel: "Xác nhận Từ chối",
          buttonClass: "bg-rose-600 hover:bg-rose-700 text-white",
          textareaPlaceholder: "Nhập lý do từ chối báo giá...",
          textareaLabel: "Lý do từ chối *",
        };
      case "returnToDraft":
        return {
          title: `Yêu cầu Chỉnh sửa [${quotationNo}]`,
          icon: RotateCcw,
          description: "Báo giá sẽ được chuyển về trạng thái Bản Nháp (DRAFT) để chuyên viên kinh doanh cập nhật.",
          buttonLabel: "Trả về Bản nháp",
          buttonClass: "bg-primary hover:bg-primary-hover text-white",
          textareaPlaceholder: "Nhập chi tiết các nội dung cần chỉnh sửa...",
          textareaLabel: "Ý kiến yêu cầu chỉnh sửa *",
        };
    }
  };

  const config = getDialogConfig();
  const Icon = config.icon;

  return (
    <ModalDialog
      open={Boolean(state)}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          setComment("");
          setValidationError(null);
          onClose();
        }
      }}
      title={
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary shrink-0" />
          <span>{config.title}</span>
        </div>
      }
      description={config.description}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {isExceptionApproval && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Chính sách Phê duyệt Ngoại lệ:</strong>
              Biên lợi nhuận của hồ sơ này là <strong>{margin}%</strong> (dưới mức sàn 15%). Theo quy định kiểm soát tài chính THILOGI, Người phê duyệt bắt buộc phải giải trình lý do chấp thuận ngoại lệ vào hệ thống kiểm toán.
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            {config.textareaLabel}
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder={config.textareaPlaceholder}
            className={`w-full p-2.5 text-xs bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary ${
              validationError ? "border-rose-500" : "border-border"
            }`}
          />
          {validationError && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {validationError}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setComment("");
              setValidationError(null);
              onClose();
            }}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className={config.buttonClass}
          >
            {isPending ? "Đang xử lý..." : config.buttonLabel}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}

