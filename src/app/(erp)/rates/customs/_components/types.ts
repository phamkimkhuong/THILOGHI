import type { CustomsRateItem, SaveCustomsRateInput } from "@/features/master-data/actions";

export type { CustomsRateItem, SaveCustomsRateInput };

export type CustomsProcedureFilter =
  | "ALL"
  | "EXPORT"
  | "IMPORT"
  | "TRANSIT"
  | "TEMP_IMPORT_REEXPORT"
  | "TEMP_EXPORT_REIMPORT";

export type CustomsServiceCodeFilter =
  | "ALL"
  | "DECLARATION"
  | "INSPECTION"
  | "QUARANTINE"
  | "PERMIT"
  | "LIQUIDATION";

export type CustomsRateStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export const PROCEDURE_OPTIONS: { id: CustomsProcedureFilter; label: string; codeName: string }[] = [
  { id: "ALL", label: "Tất cả loại hình", codeName: "ALL" },
  { id: "EXPORT", label: "Xuất khẩu (B11)", codeName: "Xuất khẩu" },
  { id: "IMPORT", label: "Nhập khẩu (A11)", codeName: "Nhập khẩu" },
  { id: "TRANSIT", label: "Quá cảnh (E62)", codeName: "Quá cảnh liên vận" },
  { id: "TEMP_IMPORT_REEXPORT", label: "Tạm nhập tái xuất (G11)", codeName: "Tạm nhập - Tái xuất" },
  { id: "TEMP_EXPORT_REIMPORT", label: "Tạm xuất tái nhập (G21)", codeName: "Tạm xuất - Tái nhập" },
];

export const SERVICE_CODE_OPTIONS: { id: CustomsServiceCodeFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả nhóm dịch vụ" },
  { id: "DECLARATION", label: "Mở tờ khai Hải quan" },
  { id: "INSPECTION", label: "Kiểm hóa luồng đỏ" },
  { id: "QUARANTINE", label: "Kiểm dịch thực vật / y tế" },
  { id: "PERMIT", label: "Giấy phép & Chứng thư XNK" },
  { id: "LIQUIDATION", label: "Thanh lý tờ khai hải quan" },
];

export const RATE_BASIS_OPTIONS: { id: string; label: string; unit: string }[] = [
  { id: "PER_DECLARATION", label: "Theo tờ khai (Per Declaration)", unit: "Tờ khai" },
  { id: "PER_CONTAINER", label: "Theo container (Per Cont)", unit: "Cont" },
  { id: "PER_TRUCK", label: "Theo chuyến xe (Per Truck)", unit: "Chuyến" },
  { id: "PER_TON", label: "Theo tấn hàng (Per Ton)", unit: "Tấn" },
  { id: "PER_LOT", label: "Theo lô hàng (Per Lot)", unit: "Lô" },
];

export const STATUS_OPTIONS: { id: CustomsRateStatusFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả trạng thái" },
  { id: "ACTIVE", label: "Đang áp dụng" },
  { id: "INACTIVE", label: "Hết hiệu lực" },
];

export function formatCurrency(amount: number, currency = "VND"): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getProcedureBadge(procedure: string): { label: string; className: string } {
  switch (procedure) {
    case "EXPORT":
      return {
        label: "Xuất khẩu (B11)",
        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
      };
    case "IMPORT":
      return {
        label: "Nhập khẩu (A11)",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      };
    case "TRANSIT":
      return {
        label: "Quá cảnh (E62)",
        className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
      };
    case "TEMP_IMPORT_REEXPORT":
      return {
        label: "Tạm nhập - Tái xuất",
        className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
      };
    case "TEMP_EXPORT_REIMPORT":
      return {
        label: "Tạm xuất - Tái nhập",
        className: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
      };
    default:
      return {
        label: procedure,
        className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
      };
  }
}

export function getServiceCodeBadge(serviceCode: string): { label: string; className: string } {
  switch (serviceCode) {
    case "DECLARATION":
      return { label: "Mở tờ khai", className: "text-blue-700 font-semibold" };
    case "INSPECTION":
      return { label: "Kiểm hóa", className: "text-red-700 font-semibold" };
    case "QUARANTINE":
      return { label: "Kiểm dịch", className: "text-emerald-700 font-semibold" };
    case "PERMIT":
      return { label: "Giấy phép XNK", className: "text-purple-700 font-semibold" };
    case "LIQUIDATION":
      return { label: "Thanh lý tờ khai", className: "text-amber-700 font-semibold" };
    default:
      return { label: serviceCode, className: "text-foreground font-semibold" };
  }
}

export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

