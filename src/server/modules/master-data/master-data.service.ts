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
 * Lấy danh sách 130 bảng giá cước mua (road_rates) thực tế phục vụ tra cứu
 */
export async function getRoadRatesDetailedList(filters?: { search?: string }) {
  let query = `
    SELECT 
      r.rate_id as "rateId",
      r.vendor_id as "vendorId",
      p_vendor.partner_name as "vendorName",
      r.pickup_location_id as "pickupLocationId",
      p.name as "pickupName",
      p.code as "pickupCode",
      r.delivery_location_id as "deliveryLocationId",
      d.name as "deliveryName",
      d.code as "deliveryCode",
      r.equipment_type as "equipmentType",
      r.buy_rate as "buyRate",
      r.currency,
      lower(r.validity_range)::text as "validFrom",
      upper(r.validity_range)::text as "validTo",
      r.status,
      r.remarks
    FROM road_rates r
    LEFT JOIN vendors v ON r.vendor_id = v.vendor_id
    LEFT JOIN partners p_vendor ON v.vendor_id = p_vendor.partner_id
    LEFT JOIN locations p ON r.pickup_location_id = p.location_id
    LEFT JOIN locations d ON r.delivery_location_id = d.location_id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  if (filters?.search) {
    params.push(`%${filters.search}%`);
    query += ` AND (p_vendor.partner_name ILIKE $1 OR p.name ILIKE $1 OR d.name ILIKE $1 OR r.equipment_type ILIKE $1)`;
  }
  query += ` ORDER BY p.name ASC, d.name ASC LIMIT 250`;
  const { rows } = await pool.query(query, params);
  return rows.map((r) => ({
    ...r,
    buyRate: Number(r.buyRate || 0),
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

/**
 * Lấy danh sách 160 địa điểm, cảng biển, depot, ICD
 */
export async function getLocationsDetailedList(filters?: { search?: string; regionId?: string }) {
  let query = `
    SELECT 
      l.location_id as "locationId",
      l.code,
      l.name,
      l.location_type as "locationType",
      l.region_id as "regionId",
      r.name as "regionName",
      l.address,
      l.is_active as "isActive"
    FROM locations l
    LEFT JOIN regions r ON l.region_id = r.region_id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  if (filters?.regionId && filters.regionId !== "ALL") {
    params.push(filters.regionId);
    query += ` AND l.region_id = $${params.length}`;
  }
  if (filters?.search) {
    params.push(`%${filters.search}%`);
    query += ` AND (l.name ILIKE $${params.length} OR l.code ILIKE $${params.length} OR l.address ILIKE $${params.length})`;
  }
  query += ` ORDER BY l.name ASC LIMIT 250`;
  const { rows } = await pool.query(query, params);
  return rows;
}

/**
 * Lấy danh sách mặt hàng thực tế từ PostgreSQL (commodities)
 * Khắc phục drift: ánh xạ đúng các trường thực tế (specifications, origin, purpose) sang UI model
 */
export async function getCommoditiesDetailedList(filters?: { search?: string }) {
  let query = `
    SELECT 
      commodity_id as "commodityId",
      name,
      english_name as "englishName",
      category,
      specifications,
      origin,
      purpose,
      status,
      created_at as "createdAt"
    FROM commodities
    WHERE 1=1
  `;
  const params: unknown[] = [];
  if (filters?.search) {
    params.push(`%${filters.search}%`);
    query += ` AND (name ILIKE $1 OR english_name ILIKE $1 OR category ILIKE $1)`;
  }
  query += ` ORDER BY name ASC LIMIT 100`;
  const { rows } = await pool.query(query, params);
  return rows.map((r) => ({
    commodityId: r.commodityId,
    name: r.name,
    englishName: r.englishName,
    category: r.category || "Hàng bách hóa",
    specialRequirements: r.specifications || r.purpose || (r.origin ? `Xuất xứ: ${r.origin}` : ""),
    notes: [
      r.origin ? `Xuất xứ: ${r.origin}` : null,
      r.specifications ? `Quy cách: ${r.specifications}` : null,
      r.purpose ? `Mục đích: ${r.purpose}` : null,
    ].filter(Boolean).join(" | "),
    status: r.status,
    createdAt: r.createdAt,
  }));
}

/**
 * Lấy danh sách đội xe (752 đầu kéo, 873 rơ-moóc)
 */
export async function getFleetDetailedList(limit = 1000) {
  const [tractorsRes, trailersRes, driversRes] = await Promise.all([
    pool.query(
      `SELECT tractor_id as "tractorId", plate_number as "plateNumber", model, status, ownership 
       FROM tractors 
       ORDER BY plate_number ASC LIMIT $1`,
      [limit]
    ),
    pool.query(
      `SELECT trailer_id as "trailerId", plate_number as "plateNumber", trailer_type as "trailerType", payload_capacity_kg as "payloadCapacityKg", status 
       FROM trailers 
       ORDER BY plate_number ASC LIMIT $1`,
      [limit]
    ),
    pool.query(
      `SELECT driver_id as "driverId", full_name as "fullName", phone, license_number as "licenseNumber", status 
       FROM drivers 
       ORDER BY full_name ASC LIMIT $1`,
      [limit]
    ),
  ]);

  return {
    tractors: tractorsRes.rows,
    trailers: trailersRes.rows,
    drivers: driversRes.rows,
  };
}

