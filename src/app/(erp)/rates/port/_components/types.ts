import type { PortRateItem, SavePortRateInput } from "@/features/master-data/actions";

export type { PortRateItem, SavePortRateInput };

export type ChargeCodeFilter = "ALL" | "LOLO" | "POWER" | "THC_PORT" | "STORAGE";
export type ContainerTypeFilter = "ALL" | "20GP" | "20HR" | "40HC" | "40HR" | "ALL";
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

