export interface LocationRecord {
  locationId: string;
  code: string;
  name: string;
  locationType: string;
  regionId: string;
  regionName: string;
  countryCode?: string;
  province?: string;
  address?: string;
  gpsCoordinates?: string;
  company?: string;
  contact?: string | null;
  note?: string | null;
  commodities?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  status?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegionRecord {
  id: string;
  name: string;
  code?: string;
}

export interface LocationFormData {
  locationId?: string;
  code: string;
  name: string;
  locationType: string;
  regionId: string;
  countryCode: string;
  province: string;
  address: string;
  gpsCoordinates: string;
  company: string;
  contact: string;
  note: string;
  commodities: string;
  isActive: boolean;
}

export const DEFAULT_FORM_DATA: LocationFormData = {
  code: "",
  name: "",
  locationType: "Warehouse",
  regionId: "",
  countryCode: "VN",
  province: "",
  address: "",
  gpsCoordinates: "",
  company: "THILOGI",
  contact: "",
  note: "",
  commodities: "",
  isActive: true,
};

export const COUNTRY_CONFIG: Record<string, { name: string; flag: string; badgeClass: string }> = {
  VN: { name: "Việt Nam", flag: "🇻🇳", badgeClass: "bg-surface border-border text-muted-foreground" },
  LA: { name: "Lào", flag: "🇱🇦", badgeClass: "bg-surface border-border text-muted-foreground" },
  KH: { name: "Campuchia", flag: "🇰🇭", badgeClass: "bg-surface border-border text-muted-foreground" },
  CN: { name: "Trung Quốc", flag: "🇨🇳", badgeClass: "bg-surface border-border text-muted-foreground" },
};

export const LOCATION_TYPES = [
  "Warehouse",
  "Stuffing Place",
  "Port",
  "Border",
  "City/Port",
];

export function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
