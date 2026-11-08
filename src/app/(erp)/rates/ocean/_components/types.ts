import type { OceanRateItem, SaveOceanRateInput } from "@/features/master-data/actions";

export type { OceanRateItem, SaveOceanRateInput };

/**
 * Tỷ giá quy đổi chuẩn USD -> VND cho vận tải biển
 */
export const OCEAN_FX_RATE_USD_VND = 25700;

export type ContainerTypeFilter = "ALL" | "40HR" | "20HR" | "40HC" | "20GP";
export type OceanRateStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export const CONTAINER_TYPE_OPTIONS: { id: ContainerTypeFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả loại cont" },
  { id: "40HR", label: "40HR (Lạnh 40ft)" },
  { id: "20HR", label: "20HR (Lạnh 20ft)" },
  { id: "40HC", label: "40HC (Khô 40ft High Cube)" },
  { id: "20GP", label: "20GP (Khô 20ft Tiêu chuẩn)" },
];

export const STATUS_OPTIONS: { id: OceanRateStatusFilter; label: string }[] = [
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

export function formatCurrency(amount: number, currency = "VND"): string {
  if (currency === "USD") {
    return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
  }
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

export function formatUsd(amount: number): string {
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

export function getContainerTypeBadge(containerType: string): { label: string; className: string } {
  if (containerType.includes("HR") || containerType.includes("RF") || containerType.toLowerCase().includes("lạnh")) {
    return {
      label: `${containerType} ❄️ Lạnh`,
      className: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
    };
  }
  return {
    label: `${containerType} 📦 Khô`,
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };
}

