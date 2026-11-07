export interface CommodityRecord {
  commodityId: string;
  name: string;
  englishName?: string;
  category: string;
  specifications?: string;
  components?: string;
  origin?: string;
  purpose?: string;
  imageUrl?: string | null;
  attachmentUrl?: string | null;
  note?: string;
  specialRequirements?: string;
  notes?: string;
  status: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommodityFormData {
  commodityId?: string;
  name: string;
  englishName: string;
  category: string;
  specifications: string;
  components: string;
  origin: string;
  purpose: string;
  imageUrl: string;
  note: string;
  status: string;
}

export const DEFAULT_COMMODITY_FORM: CommodityFormData = {
  name: "",
  englishName: "",
  category: "Nông sản",
  specifications: "Đóng bao",
  components: "",
  origin: "Việt Nam",
  purpose: "Thực phẩm",
  imageUrl: "",
  note: "",
  status: "Đã duyệt",
};

export const COMMON_CATEGORIES = [
  "Nông sản",
  "Thực phẩm",
  "Phân bón",
  "Thuốc bảo vệ thực vật",
  "Vật tư trồng trọt",
  "Thức ăn chăn nuôi",
  "Vật tư chăn nuôi",
  "Máy móc thiết bị",
  "Vật tư cơ khí",
  "Thủy sản",
  "Cây giống",
  "Khoáng sản",
  "Lâm sản",
  "Văn phòng phẩm",
  "Dược phẩm y tế",
  "Container",
  "Khác",
];

export const COMMON_SPECIFICATIONS = [
  "Đóng bao",
  "Đóng kiện, palet",
  "Xếp rời",
  "Đóng thùng Carton",
  "Hàng đổ xá",
  "Emty",
];

export const COMMON_ORIGINS = [
  "Việt Nam",
  "Lào",
  "Campuchia",
  "Trung Quốc",
  "Belarus",
  "Nga",
  "Isareal",
  "Canada",
  "Brunei",
  "Khác",
];

export const COMMON_PURPOSES = [
  "Thực phẩm",
  "Chăm sóc cây",
  "Xây dựng",
  "Đựng chuối tươi",
  "Dẫn nước tưới tiêu",
  "Bồn chứa nước",
  "Tinh luyện quặng",
  "Thiết bị chứa hàng",
  "Sưởi ấm",
  "Đồ mỹ nghệ",
  "Sản xuất / Gia công đồ mỹ nghệ",
  "Khác",
];

export const ORIGIN_CONFIG: Record<string, { name: string; flag: string; badgeClass: string }> = {
  "Việt Nam": { name: "Việt Nam", flag: "🇻🇳", badgeClass: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800" },
  "VN": { name: "Việt Nam", flag: "🇻🇳", badgeClass: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800" },
  "Lào": { name: "Lào", flag: "🇱🇦", badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" },
  "LA": { name: "Lào", flag: "🇱🇦", badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" },
  "Campuchia": { name: "Campuchia", flag: "🇰🇭", badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" },
  "KH": { name: "Campuchia", flag: "🇰🇭", badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" },
  "Trung Quốc": { name: "Trung Quốc", flag: "🇨🇳", badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800" },
  "CN": { name: "Trung Quốc", flag: "🇨🇳", badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800" },
  "Belarus": { name: "Belarus", flag: "🇧🇾", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
  "Nga": { name: "Nga", flag: "🇷🇺", badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800" },
  "Isareal": { name: "Israel", flag: "🇮🇱", badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800" },
  "Israel": { name: "Israel", flag: "🇮🇱", badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800" },
  "Canada": { name: "Canada", flag: "🇨🇦", badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800" },
  "Brunei": { name: "Brunei", flag: "🇧🇳", badgeClass: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800" },
  "Khác": { name: "Quốc gia khác", flag: "🌐", badgeClass: "bg-surface border-border text-foreground" },
};

export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

