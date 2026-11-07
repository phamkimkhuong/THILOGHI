import { Clock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { QuotationListItem, QuotationDetailResponse } from "@/server/modules/quotation/quotation.service";

export type { QuotationListItem, QuotationDetailResponse };

export interface QuotationFilterState {
  status: string;
  regionId: string;
  search: string;
}

export type ActionDialogType = "approve" | "reject" | "returnToDraft";

export interface ActionDialogState {
  type: ActionDialogType;
  quotationId: string;
  quotationNo: string;
  margin?: number;
}

export function formatVND(val: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
}

export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export const STATUS_TABS = [
  { id: "ALL", label: "Tất cả" },
  { id: "PENDING_APPROVAL", label: "Chờ duyệt" },
  { id: "APPROVED", label: "Đã duyệt" },
  { id: "DRAFT", label: "Bản nháp" },
  { id: "REJECTED", label: "Từ chối" },
] as const;

export const STATUS_BADGES: Record<
  string,
  { label: string; icon: typeof Clock; className: string }
> = {
  DRAFT: {
    label: "Bản Nháp",
    icon: Clock,
    className: "bg-surface-hover text-muted-foreground border-border",
  },
  PENDING_APPROVAL: {
    label: "Chờ Duyệt",
    icon: AlertTriangle,
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  },
  APPROVED: {
    label: "Đã Duyệt",
    icon: CheckCircle2,
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  },
  REJECTED: {
    label: "Từ Chối",
    icon: XCircle,
    className:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
  },
};

