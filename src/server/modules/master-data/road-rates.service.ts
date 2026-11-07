import { randomUUID } from "node:crypto";
import { pool } from "@/server/db";
import { requireRole, requireRegionScope } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";

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
