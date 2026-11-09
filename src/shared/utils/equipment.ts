/**
 * THILOGI Logistics ERP - Quản lý Danh mục Thiết bị & Container
 * Chuẩn hóa mã thiết bị, phân loại container lạnh và bảng tương đương (Equivalence Map)
 */

export interface EquipmentTypeDefinition {
  code: string;
  name: string;
  category: "REEFER_CONT" | "DRY_CONT" | "TRUCK" | "TRAILER" | "GENERAL";
  isReefer: boolean;
  aliases: string[];
  sortOrder: number;
}

export const CANONICAL_EQUIPMENT_TYPES: EquipmentTypeDefinition[] = [
  {
    code: "40HR",
    name: "Container 40' Lạnh Cao (40HR / 40RH)",
    category: "REEFER_CONT",
    isReefer: true,
    aliases: ["40HR", "40RH", "40RF"],
    sortOrder: 1,
  },
  {
    code: "20HR",
    name: "Container 20' Lạnh (20HR / 20RF)",
    category: "REEFER_CONT",
    isReefer: true,
    aliases: ["20HR", "20RF"],
    sortOrder: 2,
  },
  {
    code: "40HC",
    name: "Container 40' Cao Tiêu chuẩn (40HC)",
    category: "DRY_CONT",
    isReefer: false,
    aliases: ["40HC", "40HQ"],
    sortOrder: 3,
  },
  {
    code: "20GP",
    name: "Container 20' Tiêu chuẩn (20GP / 20DC)",
    category: "DRY_CONT",
    isReefer: false,
    aliases: ["20GP", "20DC"],
    sortOrder: 4,
  },
  {
    code: "TRUCK_15T",
    name: "Xe tải thùng 15 Tấn",
    category: "TRUCK",
    isReefer: false,
    aliases: ["TRUCK_15T"],
    sortOrder: 5,
  },
  {
    code: "TRUCK_FO",
    name: "Xe bồn chuyên dụng chất lỏng",
    category: "TRUCK",
    isReefer: false,
    aliases: ["TRUCK_FO"],
    sortOrder: 6,
  },
  {
    code: "RMS",
    name: "Rơ moóc sàn (RMS)",
    category: "TRAILER",
    isReefer: false,
    aliases: ["RMS"],
    sortOrder: 7,
  },
  {
    code: "General",
    name: "Phương tiện đa dụng (General)",
    category: "GENERAL",
    isReefer: false,
    aliases: ["General"],
    sortOrder: 8,
  },
];

/**
 * Kiểm tra mã thiết bị/container có phải là container lạnh (Reefer) không.
 * Tương thích cho cả 40HR, 40RH, 40RF, 20HR, 20RF.
 */
export function isReeferEquipment(code: string | undefined | null): boolean {
  if (!code) return false;
  const clean = code.trim().toUpperCase();
  return ["40HR", "40RH", "40RF", "20HR", "20RF"].includes(clean);
}

/**
 * Lấy danh sách các mã định danh tương đương cho 1 mã thiết bị.
 * Ví dụ: "40RH" -> ["40HR", "40RH", "40RF"]
 *        "20RF" -> ["20HR", "20RF"]
 *        "20DC" -> ["20GP", "20DC"]
 */
export function getEquivalentEquipmentCodes(code: string | undefined | null): string[] {
  if (!code || code === "ALL") return [];
  const clean = code.trim().toUpperCase();
  for (const item of CANONICAL_EQUIPMENT_TYPES) {
    if (item.aliases.some((a) => a.toUpperCase() === clean) || item.code.toUpperCase() === clean) {
      return Array.from(new Set([item.code, ...item.aliases]));
    }
  }
  return [code.trim()];
}

/**
 * Kiểm tra xem 2 mã thiết bị có tương thích / cùng loại không.
 * Bỏ qua sự khác biệt tên gọi giữa các phân hệ (ví dụ: 40RH ở báo giá khớp với 40HR ở biểu phí cảng).
 */
export function areEquipmentTypesCompatible(
  typeA: string | undefined | null,
  typeB: string | undefined | null
): boolean {
  if (!typeA || !typeB) return true;
  const cleanA = typeA.trim().toUpperCase();
  const cleanB = typeB.trim().toUpperCase();
  if (cleanA === "ALL" || cleanB === "ALL" || cleanA === cleanB) return true;

  const equivalentsA = getEquivalentEquipmentCodes(cleanA);
  return equivalentsA.some((eq) => eq.toUpperCase() === cleanB);
}

/**
 * Chuẩn hóa về mã chuẩn Canonical (ví dụ: 40RH -> 40HR, 20RF -> 20HR, 20DC -> 20GP)
 */
export function getEquipmentCanonicalCode(code: string | undefined | null): string {
  if (!code) return "";
  const clean = code.trim().toUpperCase();
  for (const item of CANONICAL_EQUIPMENT_TYPES) {
    if (item.code.toUpperCase() === clean || item.aliases.some((a) => a.toUpperCase() === clean)) {
      return item.code;
    }
  }
  return code.trim();
}

