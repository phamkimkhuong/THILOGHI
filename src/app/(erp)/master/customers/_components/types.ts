import { PartnerDirectoryItem, PartnerRoleAuditItem } from "@/server/modules/master-data/partner-lifecycle.service";

export type { PartnerDirectoryItem, PartnerRoleAuditItem };

export interface CustomerRecord {
  customerId: string;
  customerName: string;
  shortName?: string;
  taxCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  paymentTermsDays?: number;
  creditLimit?: number | null;
  status: string; // ACTIVE, PENDING, SUSPENDED
  createdAt: string;
}

export interface VendorRecord {
  vendorId: string;
  vendorName: string;
  vendorType: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  status: string;
  createdAt: string;
}

export interface PartnerFormData {
  partnerId: string;
  partnerName: string;
  shortName: string;
  sourcePartnerType: string;
  country: string;
  address: string;
  taxCode: string;
  phone: string;
  email: string;
  representedBy: string;
  bankAccount: string;
  bankName: string;
  gpsCoordinates: string;
  note: string;
  status: "ACTIVE" | "INACTIVE";
  isCustomer?: boolean;
  paymentTermsDays?: number;
  creditLimitVnd?: number | null;
}

export const DEFAULT_PARTNER_FORM: PartnerFormData = {
  partnerId: "",
  partnerName: "",
  shortName: "",
  sourcePartnerType: "Clients",
  country: "Việt Nam",
  address: "",
  taxCode: "",
  phone: "",
  email: "",
  representedBy: "",
  bankAccount: "",
  bankName: "",
  gpsCoordinates: "",
  note: "",
  status: "ACTIVE",
  isCustomer: false,
  paymentTermsDays: 30,
  creditLimitVnd: null,
};

export const COMMON_PARTNER_TYPES = [
  { value: "Clients", label: "Khách hàng (Clients)", desc: "Khách hàng thương mại ký hợp đồng thuê dịch vụ" },
  { value: "Consignee", label: "Người nhận hàng (Consignee)", desc: "Chủ hàng / Nhà máy tiếp nhận tại điểm giao" },
  { value: "Shipper", label: "Người gửi hàng (Shipper)", desc: "Chủ hàng / Nông trường tại điểm nhận" },
  { value: "Vendors", label: "Nhà xe thầu phụ (Vendors)", desc: "Đội xe vận tải ngoài thầu phụ chặng đường bộ" },
  { value: "Suppliers", label: "Nhà cung ứng (Suppliers)", desc: "Cung cấp xăng dầu, lốp xe, phụ tùng thiết bị" },
  { value: "Line", label: "Hãng tàu biển (Line)", desc: "Hãng tàu container vận chuyển đường biển quốc tế" },
  { value: "Port", label: "Cảng biển & ICD (Port)", desc: "Cảng Chu Lai, Đà Nẵng, Cát Lái, Hải Phòng..." },
  { value: "Depot", label: "Bãi container rỗng (Depot)", desc: "Bãi cấp và hạ vỏ container rỗng" },
  { value: "Stuffing Place", label: "Bãi đóng rút (Stuffing)", desc: "Điểm đóng rút hàng hóa container chuyên dụng" },
];

export const COMMON_COUNTRIES = [
  { value: "Việt Nam", label: "Việt Nam 🇻🇳" },
  { value: "Lào", label: "Lào 🇱🇦" },
  { value: "Campuchia", label: "Campuchia 🇰🇭" },
  { value: "Trung Quốc", label: "Trung Quốc 🇨🇳" },
  { value: "Khác", label: "Quốc gia khác 🌐" },
];

export const PAYMENT_TERMS_OPTIONS = [
  { value: 0, label: "0 ngày (Thanh toán ngay)" },
  { value: 7, label: "7 ngày" },
  { value: 15, label: "15 ngày" },
  { value: 30, label: "30 ngày (Tiêu chuẩn THILOGI)" },
  { value: 45, label: "45 ngày" },
  { value: 60, label: "60 ngày" },
  { value: 90, label: "90 ngày (Dự án đặc biệt)" },
];

export const PARTNER_TYPE_BADGES: Record<string, { label: string; badgeClass: string }> = {
  Clients: {
    label: "Clients",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  Consignee: {
    label: "Consignee",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  Shipper: {
    label: "Shipper",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  Vendors: {
    label: "Vendors",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  },
  Suppliers: {
    label: "Suppliers",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  },
  Line: {
    label: "Line",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
  },
  Port: {
    label: "Port",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  },
  Depot: {
    label: "Depot",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  },
  "Stuffing Place": {
    label: "Stuffing",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-900/40 dark:text-stone-300 dark:border-stone-800",
  },
};

export const PARTNER_TYPE_CHIPS = [
  { value: "ALL", label: "Tất cả" },
  { value: "Shipper", label: "Shipper" },
  { value: "Consignee", label: "Consignee" },
  { value: "Clients", label: "Clients" },
  { value: "Vendors", label: "Vendors" },
  { value: "Line", label: "Line" },
  { value: "Port", label: "Port" },
  { value: "Depot", label: "Depot" },
  { value: "Stuffing Place", label: "Stuffing Place" },
  { value: "Suppliers", label: "Suppliers" },
];

export const COUNTRY_FILTER_OPTIONS = [
  { value: "ALL", label: "Tất cả quốc gia 🌐" },
  { value: "VN", label: "Việt Nam 🇻🇳" },
  { value: "CN", label: "Trung Quốc 🇨🇳" },
  { value: "LA", label: "Lào 🇱🇦" },
  { value: "KH", label: "Campuchia 🇰🇭" },
  { value: "OTHER", label: "Quốc tế khác 🌐" },
];

export function getCountryBadge(country?: string): { flag: string; name: string } {
  if (!country) return { flag: "🌐", name: "Chưa rõ" };
  const c = country.toLowerCase().trim();
  if (c.includes("việt nam") || c.includes("viet nam") || c === "vn") {
    return { flag: "🇻🇳", name: "Việt Nam" };
  }
  if (c.includes("trung quốc") || c.includes("china") || c === "cn") {
    return { flag: "🇨🇳", name: "Trung Quốc" };
  }
  if (c.includes("lào") || c.includes("lao") || c.includes("laos")) {
    return { flag: "🇱🇦", name: "Lào" };
  }
  if (c.includes("cambodia") || c.includes("campuchia") || c === "kh") {
    return { flag: "🇰🇭", name: "Campuchia" };
  }
  return { flag: "🌐", name: country };
}

export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

