import { pool, db } from "@/server/db";
import { locations, regions } from "@/server/db/schema";
import { eq, and, asc, ilike, or } from "drizzle-orm";
import { requireRole, requireRegionScope } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";

/**
 * Lấy danh sách 160 địa điểm, cảng biển, depot, ICD qua Drizzle ORM
 */
export async function getLocationsDetailedList(filters?: { search?: string; regionId?: string }) {
  const base = db
    .select({
      locationId: locations.locationId,
      code: locations.code,
      name: locations.name,
      locationType: locations.locationType,
      regionId: locations.regionId,
      regionName: regions.name,
      countryCode: locations.countryCode,
      province: locations.province,
      address: locations.address,
      gpsCoordinates: locations.gpsCoordinates,
      company: locations.company,
      contact: locations.contact,
      note: locations.note,
      commodities: locations.commodities,
      createdBy: locations.createdBy,
      updatedBy: locations.updatedBy,
      status: locations.status,
      isActive: locations.isActive,
      createdAt: locations.createdAt,
    })
    .from(locations)
    .leftJoin(regions, eq(locations.regionId, regions.regionId));

  const conditions = [];
  if (filters?.regionId && filters.regionId !== "ALL") {
    conditions.push(eq(locations.regionId, filters.regionId));
  }
  if (filters?.search?.trim()) {
    const pattern = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(locations.name, pattern),
        ilike(locations.code, pattern),
        ilike(locations.address, pattern),
        ilike(locations.province, pattern),
        ilike(locations.company, pattern),
        ilike(locations.contact, pattern),
        ilike(locations.note, pattern),
        ilike(locations.commodities, pattern)
      )
    );
  }

  const query = conditions.length > 0 ? base.where(and(...conditions)) : base;
  return await query.orderBy(asc(locations.name)).limit(500);
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

