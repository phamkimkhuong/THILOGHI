import { pool } from "@/server/db";

export interface MasterOption {
  id: string;
  code?: string;
  name: string;
  extra?: Record<string, unknown>;
}

export const EQUIPMENT_TYPES = [
  { id: "40HC", name: "Container 40' Cao (40HC)" },
  { id: "40RH", name: "Container 40' Lạnh (40RH)" },
  { id: "20DC", name: "Container 20' Tiêu chuẩn (20DC)" },
  { id: "20RF", name: "Container 20' Lạnh (20RF)" },
  { id: "TRUCK_15T", name: "Xe tải thùng 15 Tấn" },
  { id: "TRUCK_FO", name: "Xe bồn chuyên dụng chất lỏng" },
  { id: "RMS", name: "Rơ moóc sàn (RMS)" },
  { id: "General", name: "Phương tiện đa dụng (General)" },
];

/**
 * Lấy danh sách Phân vùng nghiệp vụ thực tế từ PostgreSQL (regions)
 * Fail-Closed: Tuyệt đối không dùng dữ liệu giả/fallback
 */
export async function getMasterRegions(): Promise<MasterOption[]> {
  const { rows } = await pool.query(
    "SELECT region_id as id, name, scope as code FROM regions ORDER BY region_id ASC"
  );
  return rows;
}

/**
 * Lấy danh sách Khách hàng thực tế từ PostgreSQL (customers)
 */
export async function getMasterCustomers(): Promise<MasterOption[]> {
  const { rows } = await pool.query(
    "SELECT customer_id as id, customer_name as name, tax_code as code FROM customers WHERE status IN ('ACTIVE', 'Đã duyệt') ORDER BY customer_name ASC"
  );
  return rows;
}

/**
 * Lấy danh sách Địa điểm, Cảng, Depot, Cửa khẩu thực tế từ PostgreSQL (locations)
 */
export async function getMasterLocations(): Promise<MasterOption[]> {
  const { rows } = await pool.query(
    "SELECT location_id as id, name, code, location_type as type, region_id as \"regionId\" FROM locations WHERE is_active = true ORDER BY name ASC"
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    extra: { type: r.type, regionId: r.regionId },
  }));
}

/**
 * Lấy danh sách Mặt hàng thực tế từ PostgreSQL (commodities)
 */
export async function getMasterCommodities(): Promise<MasterOption[]> {
  const { rows } = await pool.query(
    "SELECT commodity_id as id, name, category as code FROM commodities ORDER BY name ASC"
  );
  return rows;
}

/**
 * Lấy danh sách Nhà cung cấp / Đội xe thực tế từ PostgreSQL (vendors)
 */
export async function getMasterVendors(): Promise<MasterOption[]> {
  const { rows } = await pool.query(
    "SELECT vendor_id as id, vendor_name as name, tax_code as code, vendor_type as type FROM vendors WHERE status = 'ACTIVE' ORDER BY vendor_name ASC"
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    extra: { type: r.type },
  }));
}
