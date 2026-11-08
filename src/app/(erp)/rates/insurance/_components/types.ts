import type {
  InsuranceRateItem,
  SaveInsuranceRateInput,
} from "@/server/modules/supplier-pricing/insurance-rates.service";

export type { InsuranceRateItem, SaveInsuranceRateInput };

export type CoverageTypeFilter =
  | "ALL"
  | "ALL_RISKS"
  | "WITH_AVERAGE"
  | "FREE_FROM_PARTICULAR_AVERAGE"
  | "DOMESTIC_TRANSIT";

export type TransportModeFilter = "ALL" | "ROAD" | "OCEAN" | "MULTIMODAL";

export type InsuranceRateStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export const COVERAGE_TYPE_OPTIONS: { id: CoverageTypeFilter; label: string; desc: string }[] = [
  { id: "ALL", label: "Tất cả phạm vi", desc: "Mọi điều kiện bảo hiểm" },
  { id: "ALL_RISKS", label: "Mọi rủi ro (ICC A)", desc: "Bảo hiểm toàn diện theo điều kiện Institute Cargo Clauses (A)" },
  { id: "WITH_AVERAGE", label: "Có tổn thất riêng (ICC B)", desc: "Bảo hiểm theo điều kiện Institute Cargo Clauses (B)" },
  { id: "FREE_FROM_PARTICULAR_AVERAGE", label: "Miễn tổn thất riêng (ICC C)", desc: "Bảo hiểm rủi ro cơ bản điều kiện Institute Cargo Clauses (C)" },
  { id: "DOMESTIC_TRANSIT", label: "Vận chuyển nội địa", desc: "Bảo hiểm hàng hóa vận chuyển trong lãnh thổ Việt Nam" },
];

export const TRANSPORT_MODE_OPTIONS: { id: TransportModeFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả phương thức" },
  { id: "ROAD", label: "Đường bộ (Trucking)" },
  { id: "OCEAN", label: "Đường biển (Ocean Freight)" },
  { id: "MULTIMODAL", label: "Đa phương thức (Multimodal)" },
];

export const PRICING_MODEL_OPTIONS: { id: string; label: string }[] = [
  { id: "FIXED_PER_SHIPMENT", label: "Phí khoán cố định (VND/cont hoặc chuyến)" },
  { id: "PERCENT_OF_VALUE", label: "Tỷ lệ % giá trị khai báo hàng hóa (Invoice Value)" },
];

export const RATE_BASIS_OPTIONS: { id: string; label: string; unit: string }[] = [
  { id: "PER_CONTAINER", label: "Container (VND / Cont)", unit: "VND/Cont" },
  { id: "PER_TRUCK", label: "Xe tải (VND / Chuyến)", unit: "VND/Xe" },
  { id: "PER_SHIPMENT", label: "Lô hàng / Chuyến (VND / Lô)", unit: "VND/Lô" },
  { id: "PERCENT_VALUE", label: "% Giá trị hóa đơn", unit: "%" },
];

export const STATUS_OPTIONS: { id: InsuranceRateStatusFilter; label: string }[] = [
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

export function getCoverageTypeBadge(type: string): {
  label: string;
  className: string;
} {
  switch (type) {
    case "ALL_RISKS":
      return {
        label: "Mọi rủi ro (ICC A)",
        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      };
    case "WITH_AVERAGE":
      return {
        label: "Tổn thất riêng (ICC B)",
        className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      };
    case "FREE_FROM_PARTICULAR_AVERAGE":
      return {
        label: "Miễn TT riêng (ICC C)",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      };
    case "DOMESTIC_TRANSIT":
      return {
        label: "Nội địa toàn diện",
        className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
      };
    default:
      return {
        label: type,
        className: "bg-muted text-foreground border-border",
      };
  }
}

export function getTransportModeBadge(mode: string): {
  label: string;
  className: string;
} {
  switch (mode) {
    case "ROAD":
      return {
        label: "Đường bộ",
        className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
      };
    case "OCEAN":
      return {
        label: "Đường biển",
        className: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
      };
    case "MULTIMODAL":
      return {
        label: "Đa phương thức",
        className: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
      };
    default:
      return {
        label: mode,
        className: "bg-muted text-foreground border-border",
      };
  }
}

export function getPricingModelBadge(model: string): {
  label: string;
  className: string;
} {
  switch (model) {
    case "PERCENT_OF_VALUE":
      return {
        label: "% Giá trị",
        className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
      };
    case "FIXED_PER_SHIPMENT":
    default:
      return {
        label: "Phí khoán",
        className: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
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

