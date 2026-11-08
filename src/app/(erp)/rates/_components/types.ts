export interface RoadRateItem {
  rateId: string;
  vendorId: string;
  vendorName: string;
  pickupLocationId: string;
  pickupName: string;
  pickupCode: string;
  deliveryLocationId: string;
  deliveryName: string;
  deliveryCode: string;
  equipmentType: string;
  buyRate: number;
  currency: string;
  validFrom: string;
  validTo: string;
  status: string;
  remarks?: string;
}

export type RoadRateSortOption = "price_asc" | "price_desc" | "route";

export interface RoadRateFormData {
  rateId?: string;
  vendorId: string;
  pickupLocationId: string;
  deliveryLocationId: string;
  equipmentType: string;
  buyRate: number;
  currency: string;
  validFrom: string;
  validTo: string;
  status: string;
  remarks: string;
}

export const DEFAULT_ROAD_RATE_FORM: RoadRateFormData = {
  vendorId: "",
  pickupLocationId: "",
  deliveryLocationId: "",
  equipmentType: "40HC",
  buyRate: 0,
  currency: "VND",
  validFrom: new Date().toISOString().split("T")[0],
  validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  status: "APPROVED",
  remarks: "",
};

export const COMMON_EQUIPMENT_OPTIONS = [
  { id: "40HC", label: "Container 40' Cao (40HC)" },
  { id: "40RH", label: "Container 40' Lạnh (40RH)" },
  { id: "20DC", label: "Container 20' Thường (20DC)" },
  { id: "20RF", label: "Container 20' Lạnh (20RF)" },
  { id: "TRUCK_15T", label: "Xe tải 15 Tấn" },
  { id: "TRUCK_FO", label: "Xe bồn chuyên dụng chất lỏng" },
  { id: "RMS", label: "Rơ moóc sàn (RMS)" },
  { id: "General", label: "Phương tiện đa dụng (General)" },
];

export const CURRENCY_OPTIONS = ["VND", "USD", "LAK", "KHR"];

export interface OptionItem {
  id: string;
  name: string;
  code?: string;
}

export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
