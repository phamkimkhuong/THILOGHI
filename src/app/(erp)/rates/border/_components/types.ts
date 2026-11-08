import type { BorderRateItem, SaveBorderRateInput } from "@/features/master-data/actions";

export type { BorderRateItem, SaveBorderRateInput };

export type CountryPairFilter = "ALL" | "Việt - Lào" | "Việt - CPC";
export type BorderRateStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export const COUNTRY_PAIRS: { id: CountryPairFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả quốc gia" },
  { id: "Việt - Lào", label: "Tuyến Việt - Lào" },
  { id: "Việt - CPC", label: "Tuyến Việt - Campuchia" },
];

export const STATUS_OPTIONS: { id: BorderRateStatusFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả trạng thái" },
  { id: "ACTIVE", label: "Đang áp dụng" },
  { id: "INACTIVE", label: "Hết hiệu lực" },
];

export interface StandardBorderPair {
  id: string;
  name: string;
  countryPair: "Việt - Lào" | "Việt - CPC";
  provinces: string;
}

export const STANDARD_BORDER_PAIRS: StandardBorderPair[] = [
  {
    id: "BOY-PHU",
    name: "Bờ Y – Phu Kua",
    countryPair: "Việt - Lào",
    provinces: "Kon Tum – Attapeu",
  },
  {
    id: "LAB-DAN",
    name: "Lao Bảo – Dansavanh",
    countryPair: "Việt - Lào",
    provinces: "Quảng Trị – Savannakhet",
  },
  {
    id: "CHAL-NAP",
    name: "Cha Lo – Naphao",
    countryPair: "Việt - Lào",
    provinces: "Quảng Bình – Khammouane",
  },
  {
    id: "NAMG-DAC",
    name: "Nam Giang – Dak Ta Ooc",
    countryPair: "Việt - Lào",
    provinces: "Quảng Nam – Sekong",
  },
  {
    id: "LET-OYA",
    name: "Lệ Thanh – Oyadav",
    countryPair: "Việt - CPC",
    provinces: "Gia Lai – Ratanakiri",
  },
  {
    id: "CAUT-NAPH",
    name: "Cầu Treo – Namphao",
    countryPair: "Việt - Lào",
    provinces: "Hà Tĩnh – Bolikhamxay",
  },
  {
    id: "LALAY",
    name: "La Lay – Lalay",
    countryPair: "Việt - Lào",
    provinces: "Quảng Trị – Salavan",
  },
  {
    id: "MOBA-BAV",
    name: "Mộc Bài – Bavet",
    countryPair: "Việt - CPC",
    provinces: "Tây Ninh – Svay Rieng",
  },
  {
    id: "XAMAT-TRA",
    name: "Xa Mát – Trapeang Phlong",
    countryPair: "Việt - CPC",
    provinces: "Tây Ninh – Kampong Cham",
  },
  {
    id: "HOALU-TRA",
    name: "Hoa Lư – Trapeang Sre",
    countryPair: "Việt - CPC",
    provinces: "Bình Phước – Kratie",
  },
  {
    id: "TINHB-PNP",
    name: "Tịnh Biên – Phnom Den",
    countryPair: "Việt - CPC",
    provinces: "An Giang – Takeo",
  },
  {
    id: "HATIEN-PRE",
    name: "Hà Tiên – Prek Chak",
    countryPair: "Việt - CPC",
    provinces: "Kiên Giang – Kampot",
  },
  {
    id: "CUSTOM",
    name: "Khác (Nhập tùy chọn cặp cửa khẩu mới...)",
    countryPair: "Việt - Lào",
    provinces: "",
  },
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
    return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(amount);
  }
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

export function getCountryPairBadge(countryPair: string): { label: string; className: string } {
  if (countryPair.includes("Lào") || countryPair.includes("LAO")) {
    return {
      label: "Việt - Lào 🇱🇦",
      className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    };
  }
  if (countryPair.includes("CPC") || countryPair.includes("Campuchia") || countryPair.includes("KH")) {
    return {
      label: "Việt - CPC 🇰🇭",
      className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    };
  }
  return {
    label: countryPair,
    className: "bg-muted text-muted-foreground border-border",
  };
}

