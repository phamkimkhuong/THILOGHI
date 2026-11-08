import type {
  WarehouseRateItem,
  SaveWarehouseRateInput,
} from "@/server/modules/supplier-pricing/warehouse-rates.service";

export type { WarehouseRateItem, SaveWarehouseRateInput };

export type WarehouseTypeFilter =
  | "ALL"
  | "DRY"
  | "COLD"
  | "BONDED"
  | "CFS"
  | "OPEN_YARD";

export type WarehouseServiceCodeFilter =
  | "ALL"
  | "STORAGE"
  | "INBOUND_HANDLING"
  | "OUTBOUND_HANDLING"
  | "LOADING_UNLOADING"
  | "PICKING_PACKING"
  | "PALLET_HANDLING"
  | "COLD_STORAGE";

export type WarehouseRateStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export const WAREHOUSE_TYPE_OPTIONS: { id: WarehouseTypeFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả loại kho" },
  { id: "DRY", label: "Kho khô / Tổng hợp" },
  { id: "COLD", label: "Kho lạnh (-18°C ~ +5°C)" },
  { id: "BONDED", label: "Kho ngoại quan" },
  { id: "CFS", label: "Kho hàng lẻ CFS" },
  { id: "OPEN_YARD", label: "Bãi ngoài trời" },
];

export const SERVICE_CODE_OPTIONS: { id: WarehouseServiceCodeFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả nhóm dịch vụ" },
  { id: "STORAGE", label: "Lưu kho" },
  { id: "INBOUND_HANDLING", label: "Tiếp nhận & Nhập kho" },
  { id: "OUTBOUND_HANDLING", label: "Chuẩn bị & Xuất kho" },
  { id: "LOADING_UNLOADING", label: "Bốc / dỡ hàng hóa" },
  { id: "PICKING_PACKING", label: "Soạn & Đóng gói" },
  { id: "PALLET_HANDLING", label: "Xử lý Pallet" },
  { id: "COLD_STORAGE", label: "Lưu kho lạnh chuyên dụng" },
];

export const RATE_BASIS_OPTIONS: { id: string; label: string; unit: string }[] = [
  { id: "TON_DAY", label: "Tấn / Ngày", unit: "Tấn/ngày" },
  { id: "PALLET_DAY", label: "Pallet / Ngày", unit: "Pallet/ngày" },
  { id: "CBM_DAY", label: "m³ / Ngày", unit: "m³/ngày" },
  { id: "M2_DAY", label: "m² sàn / Ngày", unit: "m²/ngày" },
  { id: "LOT", label: "Trọn gói / Lô", unit: "Lô" },
  { id: "MONTH", label: "Cố định / Tháng", unit: "Tháng" },
  { id: "TRIP", label: "Theo Chuyến xe", unit: "Chuyến" },
];

export const STATUS_OPTIONS: { id: WarehouseRateStatusFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả trạng thái" },
  { id: "ACTIVE", label: "Đang áp dụng" },
  { id: "INACTIVE", label: "Hết hiệu lực" },
];

export function formatCurrency(amount: number, currency: string = "VND"): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getWarehouseTypeBadge(type: string): {
  label: string;
  className: string;
} {
  switch (type) {
    case "COLD":
      return {
        label: "Kho Lạnh",
        className: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800",
      };
    case "BONDED":
      return {
        label: "Kho Ngoại Quan",
        className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
      };
    case "CFS":
      return {
        label: "Kho CFS",
        className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      };
    case "OPEN_YARD":
      return {
        label: "Bãi Ngoài Trời",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      };
    case "DRY":
    default:
      return {
        label: "Kho Khô / Tổng Hợp",
        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      };
  }
}

export function getWarehouseServiceBadge(serviceCode: string): {
  label: string;
  className: string;
} {
  switch (serviceCode) {
    case "STORAGE":
      return {
        label: "Lưu Kho",
        className: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
      };
    case "INBOUND_HANDLING":
      return {
        label: "Nhập Kho",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      };
    case "OUTBOUND_HANDLING":
      return {
        label: "Xuất Kho",
        className: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
      };
    case "LOADING_UNLOADING":
      return {
        label: "Bốc / Dỡ",
        className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
      };
    case "PICKING_PACKING":
      return {
        label: "Soạn & Đóng Gói",
        className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
      };
    case "PALLET_HANDLING":
      return {
        label: "Xử Lý Pallet",
        className: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
      };
    case "COLD_STORAGE":
      return {
        label: "Lưu Kho Lạnh",
        className: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800",
      };
    default:
      return {
        label: serviceCode,
        className: "bg-muted text-foreground border-border",
      };
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

