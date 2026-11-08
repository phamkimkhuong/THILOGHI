import type { MasterServicePackage, SaveServicePackageInput } from "@/features/master-data/actions";

export type { MasterServicePackage, SaveServicePackageInput };

export type ServiceCategoryFilter = "ALL" | "CORE_TRANSPORT" | "PORT_DEPOT" | "CLEARANCE" | "WAREHOUSE" | "VALUE_ADDED";
export type ServiceStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export const CATEGORIES_LIST: { id: ServiceCategoryFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả nhóm" },
  { id: "CORE_TRANSPORT", label: "Vận tải chính" },
  { id: "PORT_DEPOT", label: "Cảng & Depot" },
  { id: "CLEARANCE", label: "Hải quan & Cửa khẩu" },
  { id: "WAREHOUSE", label: "Kho bãi & Lưu trữ" },
  { id: "VALUE_ADDED", label: "Dịch vụ gia tăng" },
];

export const STATUS_LIST: { id: ServiceStatusFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả trạng thái" },
  { id: "ACTIVE", label: "Đang hoạt động" },
  { id: "INACTIVE", label: "Tạm dừng" },
];

export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function getCategoryBadge(category: string) {
  switch (category) {
    case "CORE_TRANSPORT":
      return {
        label: "Vận tải chính",
        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
      };
    case "PORT_DEPOT":
      return {
        label: "Cảng & Depot",
        className: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
      };
    case "CLEARANCE":
      return {
        label: "Hải quan & Cửa khẩu",
        className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
      };
    case "WAREHOUSE":
      return {
        label: "Kho bãi & Lưu trữ",
        className: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
      };
    case "VALUE_ADDED":
      return {
        label: "Dịch vụ gia tăng",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
      };
    default:
      return {
        label: category,
        className: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
      };
  }
}

export function getPricingTypeBadge(type: string) {
  if (type === "ROUTE_BASED") {
    return {
      label: "Theo tuyến (A → B)",
      desc: "Yêu cầu Điểm đi, Điểm đến, Loại Cont",
      className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
    };
  }
  return {
    label: "Theo đơn vị / Lần",
    desc: "Tính theo Cont, Tấn, Ngày, Tờ khai",
    className: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300",
  };
}

