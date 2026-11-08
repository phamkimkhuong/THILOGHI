import type { PortRateItem, SavePortRateInput } from "@/features/master-data/actions";

export type { PortRateItem, SavePortRateInput };

export type ChargeCodeFilter = "ALL" | "LOLO" | "POWER" | "THC_PORT" | "STORAGE";
export type ContainerTypeFilter = "ALL" | "20GP" | "20HR" | "40HC" | "40HR";
export type PortRateStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export const CHARGE_CODES: { id: ChargeCodeFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả tác nghiệp" },
  { id: "LOLO", label: "Nâng hạ container (LO-LO)" },
  { id: "POWER", label: "Cắm điện lạnh (Power)" },
  { id: "THC_PORT", label: "Phí THC Cảng" },
  { id: "STORAGE", label: "Lưu bãi container" },
];

export const CONTAINER_TYPES: { id: ContainerTypeFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả loại cont" },
  { id: "20GP", label: "Container 20' Thường (20GP)" },
  { id: "20HR", label: "Container 20' Lạnh (20HR)" },
  { id: "40HC", label: "Container 40' Cao (40HC)" },
  { id: "40HR", label: "Container 40' Lạnh (40HR)" },
];

export const STATUS_OPTIONS: { id: PortRateStatusFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả trạng thái" },
  { id: "ACTIVE", label: "Đang áp dụng" },
  { id: "INACTIVE", label: "Hết hiệu lực" },
];

export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function formatCurrency(amount: number, currency: string): string {
  if (currency === "USD") {
    return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(amount);
  }
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

export function getChargeCodeBadge(code: string): { label: string; className: string } {
  switch (code) {
    case "LOLO":
      return {
        label: "Nâng hạ LO-LO",
        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
      };
    case "POWER":
      return {
        label: "Cắm điện lạnh",
        className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
      };
    case "THC_PORT":
      return {
        label: "Phí THC Cảng",
        className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
      };
    case "STORAGE":
      return {
        label: "Lưu bãi cont",
        className: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
      };
    default:
      return {
        label: code,
        className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      };
  }
}

export function getCargoTypeBadge(cargoType: string): { label: string; className: string } {
  switch (cargoType) {
    case "Empty":
      return {
        label: "Vỏ Rỗng",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
      };
    case "Loaded":
      return {
        label: "Có Hàng",
        className: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
      };
    default:
      return {
        label: cargoType,
        className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
      };
  }
}
