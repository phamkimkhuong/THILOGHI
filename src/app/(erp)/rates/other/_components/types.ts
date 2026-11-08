import type {
  OtherRateItem,
  SaveOtherRateInput,
} from "@/server/modules/supplier-pricing/other-rates.service";

export type { OtherRateItem, SaveOtherRateInput };

export type ServiceCodeFilter =
  | "ALL"
  | "SURVEY"
  | "SPECIAL_EQUIPMENT"
  | "DOCUMENT_DELIVERY"
  | "ESCORT"
  | "OTHER_TEMPORARY";

export type PricingMethodFilter = "ALL" | "FIXED" | "UNIT_RATE" | "ACTUAL";

export type OtherRateStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export const OTHER_SERVICE_CODE_OPTIONS: {
  id: ServiceCodeFilter;
  label: string;
  desc: string;
}[] = [
  { id: "ALL", label: "Tất cả dịch vụ khác", desc: "Mọi mã dịch vụ bổ sung" },
  {
    id: "SURVEY",
    label: "Giám định / Khảo sát",
    desc: "Khảo sát tuyến đường, kiểm đếm độc lập, giám định tình trạng hàng hóa",
  },
  {
    id: "SPECIAL_EQUIPMENT",
    label: "Thiết bị chuyên dụng",
    desc: "Cẩu bánh xích, kích thủy lực, xe nâng nặng ngoài bãi khách hàng",
  },
  {
    id: "DOCUMENT_DELIVERY",
    label: "Chuyển giao chứng từ",
    desc: "Giao nhận bộ chứng từ gốc (B/L, C/O, kiểm dịch) tận tay khách hàng",
  },
  {
    id: "ESCORT",
    label: "Dẫn đường / Hộ tống",
    desc: "Xe hoa tiêu, hộ tống đoàn xe hàng siêu trường siêu trọng (OOG)",
  },
  {
    id: "OTHER_TEMPORARY",
    label: "Dịch vụ tạm thời",
    desc: "Nghiệp vụ cá biệt chưa có mã chuẩn, bắt buộc nhập lý do và review",
  },
];

export const PRICING_METHOD_OPTIONS: {
  id: string;
  label: string;
  desc: string;
}[] = [
  { id: "FIXED", label: "Phí khoán cố định", desc: "Đơn giá cố định theo lô hoặc trọn gói" },
  { id: "UNIT_RATE", label: "Đơn giá theo khối lượng / thời gian", desc: "Tính theo đơn giá x số lượng/ca/giờ thực tế" },
  { id: "ACTUAL", label: "Thu chi theo thực tế (Hóa đơn/Biên lai)", desc: "Chi phí thực tế phát sinh, bắt buộc kèm chứng từ phê duyệt" },
];

export const RATE_BASIS_OPTIONS: { id: string; label: string; unit: string }[] = [
  { id: "LOT", label: "Trọn gói / Lô", unit: "Lô" },
  { id: "SET", label: "Bộ chứng từ", unit: "Bộ" },
  { id: "SHIFT", label: "Theo Ca làm việc (8h)", unit: "Ca" },
  { id: "HOUR", label: "Theo Giờ làm việc", unit: "Giờ" },
  { id: "TRIP", label: "Theo Chuyến xe", unit: "Chuyến" },
  { id: "KM", label: "Theo Cây số (km)", unit: "km" },
  { id: "ACTUAL_RECEIPT", label: "Theo Biên lai / Hóa đơn thực tế", unit: "Biên lai" },
];

export const STATUS_OPTIONS: { id: OtherRateStatusFilter; label: string }[] = [
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

export function getServiceCodeBadge(code: string): {
  label: string;
  className: string;
} {
  switch (code) {
    case "SURVEY":
      return {
        label: "Giám Định / Khảo Sát",
        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      };
    case "SPECIAL_EQUIPMENT":
      return {
        label: "Thiết Bị Chuyên Dụng",
        className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      };
    case "DOCUMENT_DELIVERY":
      return {
        label: "Chuyển Giao Chứng Từ",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      };
    case "ESCORT":
      return {
        label: "Dẫn Đường / Hộ Tống",
        className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
      };
    case "OTHER_TEMPORARY":
      return {
        label: "Dịch Vụ Tạm Thời",
        className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
      };
    default:
      return {
        label: code,
        className: "bg-muted text-foreground border-border",
      };
  }
}

export function getPricingMethodBadge(method: string): {
  label: string;
  className: string;
} {
  switch (method) {
    case "FIXED":
      return {
        label: "Cố định",
        className: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
      };
    case "UNIT_RATE":
      return {
        label: "Đơn giá",
        className: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
      };
    case "ACTUAL":
      return {
        label: "Thực tế (Evidence)",
        className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
      };
    default:
      return {
        label: method,
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

