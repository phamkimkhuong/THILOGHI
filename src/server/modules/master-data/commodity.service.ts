import { pool } from "@/server/db";
import { requireRole } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";

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
