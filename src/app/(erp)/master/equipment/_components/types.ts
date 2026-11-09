export interface MasterEquipmentTypeItem {
  equipmentTypeId: string;
  equipmentName: string;
  category: string;
  categoryName: string;
  isReefer: boolean;
  aliases: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export type EquipmentCategoryFilter =
  | "ALL"
  | "REEFER_CONT"
  | "DRY_CONT"
  | "TRUCK"
  | "TRAILER"
  | "GENERAL";

export type EquipmentStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export const CATEGORY_OPTIONS: { id: EquipmentCategoryFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả nhóm" },
  { id: "REEFER_CONT", label: "Container Lạnh" },
  { id: "DRY_CONT", label: "Container Khô / Bách hóa" },
  { id: "TRUCK", label: "Xe tải chuyên dụng" },
  { id: "TRAILER", label: "Rơ moóc" },
  { id: "GENERAL", label: "Đa dụng" },
];

export const STATUS_OPTIONS: { id: EquipmentStatusFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả trạng thái" },
  { id: "ACTIVE", label: "Đang áp dụng" },
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

