import { pool } from "@/server/db";

export interface MasterOption {
  id: string;
  code?: string;
  name: string;
  extra?: Record<string, unknown>;
}

// Dữ liệu mẫu đồng bộ với 02-schema-r1.sql khi DB chưa sẵn sàng
const FALLBACK_REGIONS: MasterOption[] = [
  { id: "REG_QNG_QNM", name: "Quảng Nam - Quảng Ngãi - Lân cận", code: "QUANG_NAM_NEIGHBORS" },
  { id: "REG_SOUTH_LAOS", name: "Khu vực Nam Lào (Sekong, Attapeu, Salavan)", code: "SOUTH_LAOS" },
  { id: "REG_NORTH_CAM", name: "Khu vực Bắc Campuchia - Tây Nguyên", code: "NORTH_CAMBODIA_CENTRAL_HIGHLANDS" },
];

const FALLBACK_CUSTOMERS: MasterOption[] = [
  { id: "CUST_APFCO", name: "Công ty Cổ phần Nông sản Thực phẩm Quảng Ngãi (APFCO)", code: "4300321456" },
  { id: "CUST_TTC", name: "Công ty Cổ phần Thành Thành Công - Biên Hòa (TTC)", code: "3600287123" },
  { id: "CUST_SMC", name: "Công ty TNHH Thương mại SMC Logistics", code: "0303123890" },
];

const FALLBACK_LOCATIONS: MasterOption[] = [
  { id: "LOC_PORT_CHULAI", name: "Cảng Quốc tế Chu Lai (Chu Lai Port)", code: "VNCHL", extra: { type: "PORT" } },
  { id: "LOC_PORT_TIENSA", name: "Cảng Tiên Sa Đà Nẵng (Tien Sa Port)", code: "VNTIS", extra: { type: "PORT" } },
  { id: "LOC_GATE_NAMGIANG", name: "Cửa khẩu Quốc tế Nam Giang", code: "VNNAM", extra: { type: "BORDER_GATE" } },
  { id: "LOC_GATE_BOY", name: "Cửa khẩu Quốc tế Bờ Y", code: "VNBOY", extra: { type: "BORDER_GATE" } },
  { id: "LOC_GATE_LAOBAO", name: "Cửa khẩu Quốc tế Lao Bảo", code: "VNLBO", extra: { type: "BORDER_GATE" } },
  { id: "LOC_KCN_TAMHIEP", name: "KCN Tam Hiệp - Chu Lai", code: "KCNTAMHIEP", extra: { type: "FACTORY" } },
  { id: "LOC_LAOS_HINBOUN", name: "Khu mỏ / Nông trường Hinboun (Lào)", code: "LAHINBOUN", extra: { type: "FACTORY" } },
];

const FALLBACK_COMMODITIES: MasterOption[] = [
  { id: "COMM_TINH_BOT_SAN", name: "Tinh bột sắn xuất khẩu", code: "NONG_SAN" },
  { id: "COMM_CHUOI_TUOI", name: "Chuối tươi xuất khẩu đóng cont lạnh", code: "NONG_SAN" },
  { id: "COMM_QUANG_BAUXITE", name: "Quặng Bauxite / Thạch cao", code: "KHOANG_SAN" },
];

export const EQUIPMENT_TYPES = [
  { id: "40HC", name: "Container 40' Cao (40HC)" },
  { id: "40RH", name: "Container 40' Lạnh (40RH)" },
  { id: "20DC", name: "Container 20' Tiêu chuẩn (20DC)" },
  { id: "20RF", name: "Container 20' Lạnh (20RF)" },
  { id: "TRUCK_15T", name: "Xe tải thùng 15 Tấn" },
  { id: "TRUCK_FO", name: "Xe bồn chuyên dụng chất lỏng" },
];

export async function getMasterRegions(): Promise<MasterOption[]> {
  try {
    const { rows } = await pool.query("SELECT region_id as id, name, scope as code FROM regions ORDER BY region_id ASC");
    if (rows.length > 0) return rows;
  } catch {}
  return FALLBACK_REGIONS;
}

export async function getMasterCustomers(): Promise<MasterOption[]> {
  try {
    const { rows } = await pool.query("SELECT customer_id as id, customer_name as name, tax_code as code FROM customers WHERE status = 'ACTIVE' ORDER BY customer_name ASC");
    if (rows.length > 0) return rows;
  } catch {}
  return FALLBACK_CUSTOMERS;
}

export async function getMasterLocations(): Promise<MasterOption[]> {
  try {
    const { rows } = await pool.query("SELECT location_id as id, name, code, location_type as type FROM locations WHERE is_active = true ORDER BY name ASC");
    if (rows.length > 0) {
      return rows.map((r) => ({ id: r.id, name: r.name, code: r.code, extra: { type: r.type } }));
    }
  } catch {}
  return FALLBACK_LOCATIONS;
}

export async function getMasterCommodities(): Promise<MasterOption[]> {
  try {
    const { rows } = await pool.query("SELECT commodity_id as id, name, category as code FROM commodities ORDER BY name ASC");
    if (rows.length > 0) return rows;
  } catch {}
  return FALLBACK_COMMODITIES;
}
