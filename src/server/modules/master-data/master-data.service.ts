import { randomUUID } from "node:crypto";
import { pool } from "@/server/db";
import { requireRole, requireRegionScope } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";

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
      l.country_code as "countryCode",
      l.province,
      l.address,
      l.gps_coordinates as "gpsCoordinates",
      l.company,
      l.contact,
      l.note,
      l.commodities,
      l.created_by as "createdBy",
      l.updated_by as "updatedBy",
      l.status,
      l.is_active as "isActive",
      l.created_at as "createdAt"
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
    query += ` AND (l.name ILIKE $${params.length} OR l.code ILIKE $${params.length} OR l.address ILIKE $${params.length} OR l.province ILIKE $${params.length} OR l.company ILIKE $${params.length} OR l.contact ILIKE $${params.length} OR l.note ILIKE $${params.length} OR l.commodities ILIKE $${params.length})`;
  }
  query += ` ORDER BY l.name ASC LIMIT 500`;
  const { rows } = await pool.query(query, params);
  return rows;
}

export interface SaveLocationInput {
  locationId?: string;
  code: string;
  name: string;
  locationType: string;
  regionId: string;
  countryCode?: string;
  province?: string;
  address?: string;
  gpsCoordinates?: string;
  company?: string;
  contact?: string;
  note?: string;
  commodities?: string;
  isActive?: boolean;
}

export async function saveLocationService(input: SaveLocationInput, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);
  if (input.regionId) {
    requireRegionScope(actor, input.regionId);
  }

  const code = input.code.trim().toUpperCase();
  const name = input.name.trim();
  const locationType = input.locationType.trim();
  const regionId = input.regionId.trim();
  const countryCode = (input.countryCode || "").trim().toUpperCase() || null;
  const province = (input.province || "").trim() || null;
  const address = (input.address || "").trim() || null;
  const gpsCoordinates = (input.gpsCoordinates || "").trim() || null;
  const company = (input.company || "").trim() || null;
  const contact = (input.contact || "").trim() || null;
  const note = (input.note || "").trim() || null;
  const commodities = (input.commodities || "").trim() || null;
  const isActive = input.isActive !== false;
  const status = isActive ? "Active" : "Inactive";

  if (!code) throw new Error("Mã địa điểm không được để trống.");
  if (!name) throw new Error("Tên địa điểm không được để trống.");
  if (!locationType) throw new Error("Vui lòng chọn loại hình địa điểm.");
  if (!regionId) throw new Error("Vui lòng chọn phân vùng.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (input.locationId) {
      const oldRes = await client.query("SELECT * FROM locations WHERE location_id = $1 FOR UPDATE", [input.locationId]);
      if (!oldRes.rows.length) {
        throw new Error(`Địa điểm [${input.locationId}] không tồn tại.`);
      }
      const old = oldRes.rows[0];

      const dupCheck = await client.query("SELECT location_id FROM locations WHERE code = $1 AND location_id != $2", [code, input.locationId]);
      if (dupCheck.rows.length) {
        throw new Error(`Mã địa điểm [${code}] đã được sử dụng bởi địa điểm khác.`);
      }

      const updateQuery = `
        UPDATE locations
        SET code = $1, name = $2, location_type = $3, region_id = $4, country_code = $5,
            province = $6, address = $7, gps_coordinates = $8, company = $9, contact = $10,
            note = $11, commodities = $12, updated_by = $13, updated_at = NOW(), is_active = $14, status = $15
        WHERE location_id = $16
        RETURNING *;
      `;
      const res = await client.query(updateQuery, [
        code, name, locationType, regionId, countryCode,
        province, address, gpsCoordinates, company, contact,
        note, commodities, actor.fullName, isActive, status, input.locationId
      ]);

      await client.query(
        "INSERT INTO master_data_audit (entity_type, entity_id, action, actor_id, actor_name, before_data, after_data, comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        ["locations", input.locationId, "UPDATE", actor.userId, actor.fullName, JSON.stringify(old), JSON.stringify(res.rows[0]), "Cập nhật thông tin địa điểm"]
      );

      await client.query("COMMIT");
      return { success: true, message: `Đã cập nhật địa điểm [${name}].`, data: res.rows[0] };
    } else {
      const dupCheck = await client.query("SELECT location_id FROM locations WHERE code = $1", [code]);
      if (dupCheck.rows.length) {
        throw new Error(`Mã địa điểm [${code}] đã tồn tại trong hệ thống.`);
      }

      const newId = code;
      const insertQuery = `
        INSERT INTO locations (
          location_id, code, name, location_type, region_id, country_code,
          province, address, gps_coordinates, company, contact, note, commodities,
          created_by, status, is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        RETURNING *;
      `;
      const res = await client.query(insertQuery, [
        newId, code, name, locationType, regionId, countryCode,
        province, address, gpsCoordinates, company, contact, note, commodities,
        actor.fullName, status, isActive
      ]);

      await client.query(
        "INSERT INTO master_data_audit (entity_type, entity_id, action, actor_id, actor_name, before_data, after_data, comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        ["locations", newId, "CREATE", actor.userId, actor.fullName, null, JSON.stringify(res.rows[0]), "Thêm mới địa điểm"]
      );

      await client.query("COMMIT");
      return { success: true, message: `Đã thêm mới địa điểm [${name}].`, data: res.rows[0] };
    }
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function toggleLocationStatusService(locationId: string, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locRes = await client.query("SELECT * FROM locations WHERE location_id = $1 FOR UPDATE", [locationId]);
    if (!locRes.rows.length) {
      throw new Error(`Địa điểm [${locationId}] không tồn tại.`);
    }
    const loc = locRes.rows[0];
    if (loc.region_id) {
      requireRegionScope(actor, loc.region_id);
    }

    const nextActive = !loc.is_active;
    const nextStatus = nextActive ? "Active" : "Inactive";
    const updateRes = await client.query(
      "UPDATE locations SET is_active = $1, status = $2 WHERE location_id = $3 RETURNING *",
      [nextActive, nextStatus, locationId]
    );

    await client.query(
      "INSERT INTO master_data_audit (entity_type, entity_id, action, actor_id, actor_name, before_data, after_data, comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      ["locations", locationId, "TOGGLE_STATUS", actor.userId, actor.fullName, JSON.stringify(loc), JSON.stringify(updateRes.rows[0]), `Chuyển trạng thái sang ${nextStatus}`]
    );

    await client.query("COMMIT");
    return {
      success: true,
      isActive: nextActive,
      message: `Đã ${nextActive ? "kích hoạt" : "tạm dừng"} địa điểm [${loc.name}].`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteLocationService(locationId: string, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const locRes = await client.query("SELECT * FROM locations WHERE location_id = $1 FOR UPDATE", [locationId]);
    if (!locRes.rows.length) {
      throw new Error(`Địa điểm [${locationId}] không tồn tại.`);
    }
    const loc = locRes.rows[0];
    if (loc.region_id) {
      requireRegionScope(actor, loc.region_id);
    }

    const [rateCheck, quoteCheck, orderCheck, shippingCheck, oceanCheck] = await Promise.all([
      client.query("SELECT rate_id FROM road_rates WHERE pickup_location_id = $1 OR delivery_location_id = $1 LIMIT 1", [locationId]),
      client.query("SELECT item_id FROM quotation_service_items WHERE origin_location_id = $1 OR destination_location_id = $1 LIMIT 1", [locationId]),
      client.query("SELECT item_id FROM order_service_items WHERE origin_location_id = $1 OR destination_location_id = $1 LIMIT 1", [locationId]),
      client.query("SELECT order_id FROM shipping_orders WHERE pickup_location_id = $1 OR delivery_location_id = $1 LIMIT 1", [locationId]),
      client.query("SELECT request_id FROM ocean_work_requests WHERE pod_location_id = $1 OR pol_location_id = $1 LIMIT 1", [locationId]),
    ]);

    const isReferenced =
      rateCheck.rows.length > 0 ||
      quoteCheck.rows.length > 0 ||
      orderCheck.rows.length > 0 ||
      shippingCheck.rows.length > 0 ||
      oceanCheck.rows.length > 0;

    if (isReferenced) {
      throw new Error(
        `Địa điểm [${loc.name}] đang được liên kết trong Bảng giá hoặc Đơn hàng vận chuyển. Để đảm bảo tính toàn vẹn dữ liệu, vui lòng chuyển trạng thái sang "Tạm dừng hoạt động" thay vì xóa vĩnh viễn.`
      );
    }

    await client.query("DELETE FROM locations WHERE location_id = $1", [locationId]);

    await client.query(
      "INSERT INTO master_data_audit (entity_type, entity_id, action, actor_id, actor_name, before_data, after_data, comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      ["locations", locationId, "DELETE", actor.userId, actor.fullName, JSON.stringify(loc), null, `Xóa địa điểm [${loc.name}]`]
    );

    await client.query("COMMIT");
    return { success: true, message: `Đã xóa vĩnh viễn địa điểm [${loc.name}].` };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
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
      components,
      origin,
      purpose,
      image_url as "imageUrl",
      attachment_url as "attachmentUrl",
      note,
      status,
      created_by as "createdBy",
      updated_by as "updatedBy",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM commodities
    WHERE 1=1
  `;
  const params: unknown[] = [];
  if (filters?.search) {
    params.push(`%${filters.search}%`);
    query += ` AND (name ILIKE $1 OR english_name ILIKE $1 OR category ILIKE $1 OR origin ILIKE $1 OR specifications ILIKE $1 OR purpose ILIKE $1 OR note ILIKE $1)`;
  }
  query += ` ORDER BY name ASC LIMIT 200`;
  const { rows } = await pool.query(query, params);
  return rows.map((r) => ({
    commodityId: r.commodityId,
    name: r.name,
    englishName: r.englishName || "",
    category: r.category || "",
    specifications: r.specifications || "",
    components: r.components || "",
    origin: r.origin || "",
    purpose: r.purpose || "",
    imageUrl: r.imageUrl || null,
    attachmentUrl: r.attachmentUrl || null,
    note: r.note || "",
    specialRequirements: r.specifications || r.purpose || (r.origin ? `Xuất xứ: ${r.origin}` : ""),
    notes: [
      r.origin ? `Xuất xứ: ${r.origin}` : null,
      r.specifications ? `Quy cách: ${r.specifications}` : null,
      r.purpose ? `Mục đích: ${r.purpose}` : null,
      r.note ? `Ghi chú: ${r.note}` : null,
    ].filter(Boolean).join(" | "),
    status: r.status || "Đã duyệt",
    createdBy: r.createdBy || null,
    updatedBy: r.updatedBy || null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export interface SaveCommodityInput {
  commodityId?: string;
  name: string;
  englishName?: string;
  category: string;
  specifications?: string;
  components?: string;
  origin?: string;
  purpose?: string;
  imageUrl?: string;
  note?: string;
  status?: string;
}

export async function saveCommodityService(input: SaveCommodityInput, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);

  const name = input.name.trim();
  const category = (input.category || "").trim();
  const englishName = (input.englishName || "").trim() || null;
  const specifications = (input.specifications || "").trim() || null;
  const components = (input.components || "").trim() || null;
  const origin = (input.origin || "").trim() || null;
  const purpose = (input.purpose || "").trim() || null;
  const imageUrl = (input.imageUrl || "").trim() || null;
  const note = (input.note || "").trim() || null;
  const status = (input.status || "Đã duyệt").trim();

  if (!name) throw new Error("Tên hàng hóa không được để trống.");
  if (!category) throw new Error("Vui lòng chọn nhóm phân loại hàng hóa.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (input.commodityId) {
      const oldRes = await client.query("SELECT * FROM commodities WHERE commodity_id = $1 FOR UPDATE", [input.commodityId]);
      if (!oldRes.rows.length) {
        throw new Error(`Mặt hàng [${input.commodityId}] không tồn tại.`);
      }
      const old = oldRes.rows[0];

      const updateQuery = `
        UPDATE commodities
        SET name = $1, english_name = $2, category = $3, specifications = $4,
            components = $5, origin = $6, purpose = $7, image_url = $8,
            note = $9, status = $10, updated_by = $11, updated_at = NOW()
        WHERE commodity_id = $12
        RETURNING *;
      `;
      const res = await client.query(updateQuery, [
        name, englishName, category, specifications,
        components, origin, purpose, imageUrl,
        note, status, actor.fullName, input.commodityId
      ]);

      await client.query(
        "INSERT INTO master_data_audit (entity_type, entity_id, action, actor_id, actor_name, before_data, after_data, comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        ["commodities", input.commodityId, "UPDATE", actor.userId, actor.fullName, JSON.stringify(old), JSON.stringify(res.rows[0]), "Cập nhật thông tin hàng hóa"]
      );

      await client.query("COMMIT");
      return { success: true, message: `Đã cập nhật mặt hàng [${name}].`, data: res.rows[0] };
    } else {
      const genId = "CMD" + Date.now().toString().slice(-8);
      const newId = genId;

      const insertQuery = `
        INSERT INTO commodities (
          commodity_id, name, english_name, category, specifications,
          components, origin, purpose, image_url, note, status,
          created_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *;
      `;
      const res = await client.query(insertQuery, [
        newId, name, englishName, category, specifications,
        components, origin, purpose, imageUrl, note, status,
        actor.fullName
      ]);

      await client.query(
        "INSERT INTO master_data_audit (entity_type, entity_id, action, actor_id, actor_name, before_data, after_data, comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        ["commodities", newId, "CREATE", actor.userId, actor.fullName, null, JSON.stringify(res.rows[0]), "Thêm mới hàng hóa"]
      );

      await client.query("COMMIT");
      return { success: true, message: `Đã thêm mới mặt hàng [${name}].`, data: res.rows[0] };
    }
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function toggleCommodityStatusService(commodityId: string, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const oldRes = await client.query("SELECT * FROM commodities WHERE commodity_id = $1 FOR UPDATE", [commodityId]);
    if (!oldRes.rows.length) {
      throw new Error(`Mặt hàng [${commodityId}] không tồn tại.`);
    }
    const old = oldRes.rows[0];
    const nextStatus = old.status === "Đã duyệt" ? "Tạm ngưng" : "Đã duyệt";

    const updateRes = await client.query(
      "UPDATE commodities SET status = $1, updated_by = $2, updated_at = NOW() WHERE commodity_id = $3 RETURNING *",
      [nextStatus, actor.fullName, commodityId]
    );

    await client.query(
      "INSERT INTO master_data_audit (entity_type, entity_id, action, actor_id, actor_name, before_data, after_data, comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      ["commodities", commodityId, "TOGGLE_STATUS", actor.userId, actor.fullName, JSON.stringify(old), JSON.stringify(updateRes.rows[0]), `Chuyển trạng thái sang ${nextStatus}`]
    );

    await client.query("COMMIT");
    return { success: true, status: nextStatus, message: `Đã chuyển trạng thái mặt hàng [${old.name}] sang [${nextStatus}].` };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteCommodityService(commodityId: string, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const oldRes = await client.query("SELECT * FROM commodities WHERE commodity_id = $1 FOR UPDATE", [commodityId]);
    if (!oldRes.rows.length) {
      throw new Error(`Mặt hàng [${commodityId}] không tồn tại.`);
    }
    const old = oldRes.rows[0];

    // Foreign Key check: customer_quotations
    const quoteCheck = await client.query(
      "SELECT quotation_id FROM customer_quotations WHERE commodity_id = $1 LIMIT 1",
      [commodityId]
    );
    if (quoteCheck.rows.length > 0) {
      throw new Error(
        `Không thể xóa mặt hàng [${old.name}]. Mặt hàng này đang được sử dụng trong Báo giá [${quoteCheck.rows[0].quotation_id}]. Vui lòng chuyển trạng thái sang "Tạm ngưng" thay vì xóa.`
      );
    }

    await client.query("DELETE FROM commodities WHERE commodity_id = $1", [commodityId]);

    await client.query(
      "INSERT INTO master_data_audit (entity_type, entity_id, action, actor_id, actor_name, before_data, after_data, comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      ["commodities", commodityId, "DELETE", actor.userId, actor.fullName, JSON.stringify(old), null, `Xóa mặt hàng [${old.name}]`]
    );

    await client.query("COMMIT");
    return { success: true, message: `Đã xóa mặt hàng [${old.name}].` };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export interface TractorFleetItem {
  tractorNo: string;
  vendorId: string;
  vendorName: string;
  vendorShortName?: string;
  modelType?: string;
  transitRoute?: string;
  transitLicenseDate?: string;
  productionYear?: number;
  chassisNo?: string;
  engineNo?: string;
  selfWeightTons?: number;
  loadCapacityTons?: number;
  color?: string;
  inspectionExpirationDate?: string;
  attachmentUrl?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export interface TrailerFleetItem {
  trailerNo: string;
  vendorId: string;
  vendorName: string;
  vendorShortName?: string;
  modelType?: string;
  transitRoute?: string;
  transitLicenseDate?: string;
  manufacturer?: string;
  productionYear?: number;
  chassisNo?: string;
  curbWeightTons?: number;
  payloadCapacityTons?: number;
  paintColor?: string;
  inspectionExpirationDate?: string;
  attachmentUrl?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export interface DriverFleetItem {
  driverId: string;
  vendorId: string;
  vendorName: string;
  vendorShortName?: string;
  fullName: string;
  gender?: string;
  birthday?: string;
  licenseNo?: string;
  citizenId?: string;
  citizenIssueDate?: string;
  passportNo?: string;
  passportIssueDate?: string;
  phone?: string;
  nationality?: string;
  hometown?: string;
  gpsCoordinates?: string;
  address?: string;
  avatarUrl?: string;
  notes?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Lấy danh sách đội xe (752 đầu kéo, 873 rơ-moóc, 669 tài xế)
 */
export async function getFleetDetailedList(limit = 1000): Promise<{
  tractors: TractorFleetItem[];
  trailers: TrailerFleetItem[];
  drivers: DriverFleetItem[];
}> {
  const [tractorsRes, trailersRes, driversRes] = await Promise.all([
    pool.query(
      `SELECT 
        t.tractor_no as "tractorNo",
        t.vendor_id as "vendorId",
        COALESCE(p.short_name, p.partner_name, t.vendor_id) as "vendorName",
        p.short_name as "vendorShortName",
        t.model_type as "modelType",
        t.transit_route as "transitRoute",
        t.transit_license_date as "transitLicenseDate",
        t.production_year as "productionYear",
        t.chassis_no as "chassisNo",
        t.engine_no as "engineNo",
        t.self_weight_tons as "selfWeightTons",
        t.load_capacity_tons as "loadCapacityTons",
        t.color,
        t.inspection_expiration_date as "inspectionExpirationDate",
        t.attachment_url as "attachmentUrl",
        t.notes,
        t.status,
        t.created_at as "createdAt"
      FROM tractors t
      LEFT JOIN partners p ON t.vendor_id = p.partner_id
      ORDER BY t.tractor_no ASC 
      LIMIT $1`,
      [limit]
    ),
    pool.query(
      `SELECT 
        tr.trailer_no as "trailerNo",
        tr.vendor_id as "vendorId",
        COALESCE(p.short_name, p.partner_name, tr.vendor_id) as "vendorName",
        p.short_name as "vendorShortName",
        tr.model_type as "modelType",
        tr.transit_route as "transitRoute",
        tr.transit_license_date as "transitLicenseDate",
        tr.manufacturer,
        tr.production_year as "productionYear",
        tr.chassis_no as "chassisNo",
        tr.curb_weight_tons as "curbWeightTons",
        tr.payload_capacity_tons as "payloadCapacityTons",
        tr.paint_color as "paintColor",
        tr.inspection_expiration_date as "inspectionExpirationDate",
        tr.attachment_url as "attachmentUrl",
        tr.notes,
        tr.status,
        tr.created_at as "createdAt"
      FROM trailers tr
      LEFT JOIN partners p ON tr.vendor_id = p.partner_id
      ORDER BY tr.trailer_no ASC 
      LIMIT $1`,
      [limit]
    ),
    pool.query(
      `SELECT 
        d.driver_id as "driverId",
        d.vendor_id as "vendorId",
        COALESCE(p.short_name, p.partner_name, d.vendor_id) as "vendorName",
        p.short_name as "vendorShortName",
        d.full_name as "fullName",
        d.gender,
        d.birthday,
        d.license_no as "licenseNo",
        d.citizen_id as "citizenId",
        d.citizen_issue_date as "citizenIssueDate",
        d.passport_no as "passportNo",
        d.passport_issue_date as "passportIssueDate",
        d.phone,
        d.nationality,
        d.hometown,
        d.gps_coordinates as "gpsCoordinates",
        d.address,
        d.avatar_url as "avatarUrl",
        d.notes,
        d.status,
        d.is_active as "isActive",
        d.created_at as "createdAt"
      FROM drivers d
      LEFT JOIN partners p ON d.vendor_id = p.partner_id
      ORDER BY d.driver_id ASC 
      LIMIT $1`,
      [limit]
    ),
  ]);

  return {
    tractors: tractorsRes.rows.map((r) => ({
      tractorNo: r.tractorNo,
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      vendorShortName: r.vendorShortName || undefined,
      modelType: r.modelType || undefined,
      transitRoute: r.transitRoute || undefined,
      transitLicenseDate: r.transitLicenseDate ? new Date(r.transitLicenseDate).toISOString() : undefined,
      productionYear: r.productionYear != null ? Number(r.productionYear) : undefined,
      chassisNo: r.chassisNo || undefined,
      engineNo: r.engineNo || undefined,
      selfWeightTons: r.selfWeightTons != null ? Number(r.selfWeightTons) : undefined,
      loadCapacityTons: r.loadCapacityTons != null ? Number(r.loadCapacityTons) : undefined,
      color: r.color || undefined,
      inspectionExpirationDate: r.inspectionExpirationDate ? new Date(r.inspectionExpirationDate).toISOString() : undefined,
      attachmentUrl: r.attachmentUrl || undefined,
      notes: r.notes || undefined,
      status: r.status || "Đang hoạt động",
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })),
    trailers: trailersRes.rows.map((r) => ({
      trailerNo: r.trailerNo,
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      vendorShortName: r.vendorShortName || undefined,
      modelType: r.modelType || undefined,
      transitRoute: r.transitRoute || undefined,
      transitLicenseDate: r.transitLicenseDate ? new Date(r.transitLicenseDate).toISOString() : undefined,
      manufacturer: r.manufacturer || undefined,
      productionYear: r.productionYear != null ? Number(r.productionYear) : undefined,
      chassisNo: r.chassisNo || undefined,
      curbWeightTons: r.curbWeightTons != null ? Number(r.curbWeightTons) : undefined,
      payloadCapacityTons: r.payloadCapacityTons != null ? Number(r.payloadCapacityTons) : undefined,
      paintColor: r.paintColor || undefined,
      inspectionExpirationDate: r.inspectionExpirationDate ? new Date(r.inspectionExpirationDate).toISOString() : undefined,
      attachmentUrl: r.attachmentUrl || undefined,
      notes: r.notes || undefined,
      status: r.status || "Đang hoạt động",
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })),
    drivers: driversRes.rows.map((r) => ({
      driverId: r.driverId,
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      vendorShortName: r.vendorShortName || undefined,
      fullName: r.fullName,
      gender: r.gender || "Nam",
      birthday: r.birthday ? new Date(r.birthday).toISOString() : undefined,
      licenseNo: r.licenseNo || undefined,
      citizenId: r.citizenId || undefined,
      citizenIssueDate: r.citizenIssueDate ? new Date(r.citizenIssueDate).toISOString() : undefined,
      passportNo: r.passportNo || undefined,
      passportIssueDate: r.passportIssueDate ? new Date(r.passportIssueDate).toISOString() : undefined,
      phone: r.phone || undefined,
      nationality: r.nationality || "Việt Nam",
      hometown: r.hometown || undefined,
      gpsCoordinates: r.gpsCoordinates || undefined,
      address: r.address || undefined,
      avatarUrl: r.avatarUrl || undefined,
      notes: r.notes || undefined,
      status: r.status || "Đang hoạt động",
      isActive: Boolean(r.isActive),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })),
  };
}

export interface SaveRoadRateInput {
  rateId?: string;
  vendorId: string;
  pickupLocationId: string;
  deliveryLocationId: string;
  equipmentType: string;
  buyRate: number;
  currency?: string;
  validFrom: string;
  validTo: string;
  status?: string;
  remarks?: string;
}

export async function saveRoadRateService(input: SaveRoadRateInput, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);

  const vendorId = (input.vendorId || "").trim();
  const pickupLocationId = (input.pickupLocationId || "").trim();
  const deliveryLocationId = (input.deliveryLocationId || "").trim();
  const equipmentType = (input.equipmentType || "").trim();
  const buyRate = Number(input.buyRate);
  const currency = (input.currency || "VND").trim().toUpperCase();
  const validFrom = (input.validFrom || "").trim();
  const validTo = (input.validTo || "").trim();
  const status = (input.status || "APPROVED").trim().toUpperCase();
  const remarks = (input.remarks || "").trim() || null;

  if (!vendorId) throw new Error("Vui lòng chọn nhà cung cấp vận tải.");
  if (!pickupLocationId) throw new Error("Vui lòng chọn điểm xếp hàng (Origin).");
  if (!deliveryLocationId) throw new Error("Vui lòng chọn điểm dỡ hàng (Destination).");
  if (pickupLocationId === deliveryLocationId) throw new Error("Điểm xếp và điểm dỡ hàng phải khác nhau.");
  if (!equipmentType) throw new Error("Vui lòng chọn thiết bị / loại cont.");
  if (isNaN(buyRate) || buyRate <= 0) throw new Error("Đơn giá mua phải là số dương lớn hơn 0.");
  if (!validFrom || !validTo) throw new Error("Vui lòng nhập đầy đủ thời hạn hiệu lực từ ngày - đến ngày.");
  if (validTo <= validFrom) throw new Error("Ngày kết thúc hiệu lực phải sau ngày bắt đầu.");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Validate vendor is active
    const vendorRes = await client.query(
      "SELECT v.vendor_id, p.partner_name FROM vendors v JOIN partners p ON p.partner_id=v.vendor_id WHERE v.vendor_id=$1 AND v.role_status='ACTIVE' AND p.status='ACTIVE'",
      [vendorId]
    );
    if (!vendorRes.rows.length) {
      throw new Error(`Nhà cung cấp [${vendorId}] không tồn tại hoặc chưa được kích hoạt.`);
    }

    // Validate locations exist and are active
    const locRes = await client.query(
      "SELECT location_id, region_id, is_active FROM locations WHERE location_id=ANY($1::varchar[])",
      [[pickupLocationId, deliveryLocationId]]
    );
    if (locRes.rows.length < 2 || !locRes.rows.every((r: { is_active: boolean }) => r.is_active)) {
      throw new Error("Điểm xếp hoặc điểm dỡ không hợp lệ hoặc đang ngừng hoạt động.");
    }

    // Check actor region scope for pickup location
    const pickupLoc = locRes.rows.find((r: { location_id: string }) => r.location_id === pickupLocationId);
    if (pickupLoc?.region_id) {
      requireRegionScope(actor, pickupLoc.region_id);
    }

    let savedRow;
    let actionType: "SAVE" | "UPDATE" = "SAVE";

    if (input.rateId) {
      actionType = "UPDATE";
      const oldRes = await client.query("SELECT * FROM road_rates WHERE rate_id = $1 FOR UPDATE", [input.rateId]);
      if (!oldRes.rows.length) {
        throw new Error(`Biểu cước [${input.rateId}] không tồn tại.`);
      }
      const old = oldRes.rows[0];

      const updateQuery = `
        UPDATE road_rates
        SET vendor_id = $1, pickup_location_id = $2, delivery_location_id = $3,
            equipment_type = $4, buy_rate = $5, currency = $6,
            validity_range = $7::daterange, status = $8, remarks = $9
        WHERE rate_id = $10
        RETURNING *;
      `;
      const updateRes = await client.query(updateQuery, [
        vendorId,
        pickupLocationId,
        deliveryLocationId,
        equipmentType,
        buyRate,
        currency,
        `[${validFrom},${validTo})`,
        status,
        remarks,
        input.rateId,
      ]);
      savedRow = updateRes.rows[0];

      await client.query(
        "INSERT INTO master_data_audit (entity_type, entity_id, action, actor_id, actor_name, before_data, after_data, comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        ["rates", input.rateId, "UPDATE", actor.userId, actor.fullName, JSON.stringify(old), JSON.stringify(savedRow), "Cập nhật biểu cước đường bộ"]
      );
    } else {
      const rateId = randomUUID();
      const insertQuery = `
        INSERT INTO road_rates (rate_id, vendor_id, pickup_location_id, delivery_location_id, equipment_type, buy_rate, currency, validity_range, status, remarks)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::daterange, $9, $10)
        RETURNING *;
      `;
      const insertRes = await client.query(insertQuery, [
        rateId,
        vendorId,
        pickupLocationId,
        deliveryLocationId,
        equipmentType,
        buyRate,
        currency,
        `[${validFrom},${validTo})`,
        status,
        remarks,
      ]);
      savedRow = insertRes.rows[0];

      await client.query(
        "INSERT INTO master_data_audit (entity_type, entity_id, action, actor_id, actor_name, before_data, after_data, comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        ["rates", rateId, "SAVE", actor.userId, actor.fullName, null, JSON.stringify(savedRow), "Tạo mới biểu cước đường bộ"]
      );
    }

    await client.query("COMMIT");
    return {
      success: true as const,
      data: savedRow,
      message: actionType === "UPDATE" ? "Đã cập nhật biểu cước thành công!" : "Đã tạo mới biểu cước thành công!",
    };
  } catch (err) {
    await client.query("ROLLBACK");
    if ((err as { code?: string })?.code === "23P01") {
      throw new Error("Tuyến đường này đã tồn tại biểu cước với cùng nhà xe và loại cont trong khoảng thời gian đã chọn (trùng lấn hiệu lực).");
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function toggleRoadRateStatusService(rateId: string, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const rateRes = await client.query("SELECT * FROM road_rates WHERE rate_id = $1 FOR UPDATE", [rateId]);
    if (!rateRes.rows.length) {
      throw new Error(`Biểu cước [${rateId}] không tồn tại.`);
    }
    const rate = rateRes.rows[0];
    const newStatus = rate.status === "APPROVED" ? "RETIRED" : "APPROVED";

    const updateRes = await client.query(
      "UPDATE road_rates SET status = $1 WHERE rate_id = $2 RETURNING *",
      [newStatus, rateId]
    );

    await client.query(
      "INSERT INTO master_data_audit (entity_type, entity_id, action, actor_id, actor_name, before_data, after_data, comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      ["rates", rateId, "UPDATE", actor.userId, actor.fullName, JSON.stringify(rate), JSON.stringify(updateRes.rows[0]), `Chuyển trạng thái sang [${newStatus}]`]
    );

    await client.query("COMMIT");
    return {
      success: true as const,
      status: newStatus,
      message: `Đã đổi trạng thái biểu cước sang [${newStatus === "APPROVED" ? "Đã duyệt / Áp dụng" : "Ngưng áp dụng"}].`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteRoadRateService(rateId: string, actor: CurrentActor) {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const rateRes = await client.query("SELECT * FROM road_rates WHERE rate_id = $1 FOR UPDATE", [rateId]);
    if (!rateRes.rows.length) {
      throw new Error(`Biểu cước [${rateId}] không tồn tại.`);
    }
    const rate = rateRes.rows[0];

    const [snapshotCheck, quoteCheck] = await Promise.all([
      client.query("SELECT snapshot_id FROM quotation_buy_snapshots WHERE source_rate_id = $1 LIMIT 1", [rateId]),
      client.query("SELECT item_id FROM quotation_service_items WHERE selected_buy_rate_id = $1 LIMIT 1", [rateId]),
    ]);

    if (snapshotCheck.rows.length > 0 || quoteCheck.rows.length > 0) {
      throw new Error(
        "Biểu cước này đã được sử dụng trong các hồ sơ báo giá đã lập. Để bảo vệ tính toàn vẹn kiểm toán P&L, vui lòng chuyển trạng thái sang [Ngưng áp dụng] thay vì xóa vĩnh viễn."
      );
    }

    await client.query("DELETE FROM road_rates WHERE rate_id = $1", [rateId]);

    await client.query(
      "INSERT INTO master_data_audit (entity_type, entity_id, action, actor_id, actor_name, before_data, after_data, comment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      ["rates", rateId, "DELETE", actor.userId, actor.fullName, JSON.stringify(rate), null, "Xóa biểu cước đường bộ"]
    );

    await client.query("COMMIT");
    return { success: true as const, message: "Đã xóa vĩnh viễn biểu cước đường bộ." };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

