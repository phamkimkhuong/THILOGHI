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
 * Lấy danh sách Khách hàng thực tế từ PostgreSQL (customers role + partners identity)
 * Chỉ hiển thị đối tác có Customer Role ACTIVE
 */
export async function getMasterCustomers(): Promise<MasterOption[]> {
  const { rows } = await pool.query(
    `SELECT c.customer_id as id, p.partner_name as name, p.tax_code as code
     FROM customers c
     JOIN partners p ON c.customer_id = p.partner_id
     WHERE c.role_status = 'ACTIVE' AND p.status = 'ACTIVE'
     ORDER BY p.partner_name ASC`
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
 * Lấy danh sách Nhà cung cấp / Đội xe thực tế từ PostgreSQL (vendors role + partners identity)
 * Chỉ hiển thị đối tác có Vendor Role ACTIVE
 */
export async function getMasterVendors(): Promise<MasterOption[]> {
  const { rows } = await pool.query(
    `SELECT v.vendor_id as id, p.partner_name as name, p.tax_code as code, v.vendor_type as type
     FROM vendors v
     JOIN partners p ON v.vendor_id = p.partner_id
     WHERE v.role_status = 'ACTIVE' AND p.status = 'ACTIVE'
     ORDER BY p.partner_name ASC`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    extra: { type: r.type },
  }));
}

/**
 * Lấy danh sách khách hàng từ customers (role) JOIN partners (identity)
 */
export async function getCustomersDetailedList(filters?: { search?: string }) {
  let query = `
    SELECT 
      c.customer_id as "customerId",
      p.partner_name as "customerName",
      p.short_name as "shortName",
      p.tax_code as "taxCode",
      p.address,
      p.phone,
      p.email,
      c.payment_terms_days as "paymentTermsDays",
      c.credit_limit_vnd as "creditLimit",
      c.role_status as "status",
      c.created_at as "createdAt"
    FROM customers c
    JOIN partners p ON c.customer_id = p.partner_id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  if (filters?.search) {
    params.push(`%${filters.search}%`);
    query += ` AND (p.partner_name ILIKE $1 OR p.short_name ILIKE $1 OR p.tax_code ILIKE $1)`;
  }
  query += ` ORDER BY p.partner_name ASC LIMIT 300`;
  const { rows } = await pool.query(query, params);
  return rows;
}

/**
 * Lấy danh sách nhà cung cấp từ vendors (role) JOIN partners (identity)
 */
export async function getVendorsDetailedList(filters?: { search?: string }) {
  let query = `
    SELECT 
      v.vendor_id as "vendorId",
      p.partner_name as "vendorName",
      v.vendor_type as "vendorType",
      p.tax_code as "taxCode",
      p.phone,
      p.email,
      v.role_status as "status",
      v.created_at as "createdAt"
    FROM vendors v
    JOIN partners p ON v.vendor_id = p.partner_id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  if (filters?.search) {
    params.push(`%${filters.search}%`);
    query += ` AND (p.partner_name ILIKE $1 OR p.tax_code ILIKE $1 OR v.vendor_type ILIKE $1)`;
  }
  query += ` ORDER BY p.partner_name ASC LIMIT 200`;
  const { rows } = await pool.query(query, params);
  return rows;
}

