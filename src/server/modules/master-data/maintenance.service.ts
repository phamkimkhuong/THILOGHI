import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pool } from "@/server/db";
import { requireRegionScope, requireRole } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";
import { catalogs, catalogSchema, validateFields } from "@/features/master-data/maintenance-config";

const idSchema = z.string().trim().min(1).max(50).regex(/^[\w.-]+$/);
export const mutationSchema = z.object({
  kind: catalogSchema, id: idSchema.optional(), revision: z.string().regex(/^\d+$/).optional(),
  action: z.enum(["SAVE", "SUBMIT", "APPROVE", "REJECT", "RETIRE"]),
  fields: z.unknown().optional(), comment: z.string().trim().max(2000).default(""),
});
export async function listMaintenance(rawKind: unknown, search: string, page: number) {
  const kind = catalogSchema.parse(rawKind);
  const c = catalogs[kind];
  const q = z.string().max(200).parse(search);
  const offset = (z.number().int().min(1).max(100000).parse(page) - 1) * 25;
  let extra = "";
  let joins = "";
  let searchColumns = [`t.${c.id}::text`, `t.${c.name}::text`];
  if (kind === "partners") searchColumns.push("t.tax_code", "t.short_name", "t.phone", "t.email");
  if (kind === "locations") searchColumns.push("t.code", "t.country_code", "t.region_id");
  if (kind === "commodities") searchColumns.push("t.english_name", "t.category");
  if (kind === "customers" || kind === "vendors") {
    joins = ` LEFT JOIN partners p ON p.partner_id=t.${c.id}`;
    extra = ", p.partner_name AS display_name";
    searchColumns.push("p.partner_name", "p.tax_code");
  }
  if (kind === "rates") {
    joins = " LEFT JOIN partners p ON p.partner_id=t.vendor_id LEFT JOIN locations a ON a.location_id=t.pickup_location_id LEFT JOIN locations b ON b.location_id=t.delivery_location_id";
    extra = ", p.partner_name AS vendor_name, a.name AS pickup_name, b.name AS delivery_name, lower(t.validity_range)::text AS valid_from, upper(t.validity_range)::text AS valid_to";
    searchColumns = [...searchColumns, "p.partner_name", "t.vendor_id", "a.name", "a.code", "b.name", "b.code", "t.status"];
  }
  const result = await pool.query(`SELECT t.*, t.xmin::text AS revision ${extra} FROM ${c.table} t ${joins} WHERE ${searchColumns.map(column => `${column} ILIKE $1`).join(" OR ")} ORDER BY t.${c.id} LIMIT 26 OFFSET $2`, [`%${q}%`, offset]);
  return { rows: result.rows.slice(0, 25), hasMore: result.rows.length > 25 };
}
export async function maintenanceHistory(rawKind: unknown, id: string) {
  const kind = catalogSchema.parse(rawKind);
  idSchema.parse(id);
  const result = await pool.query("SELECT action, actor_name, before_data, after_data, comment, created_at FROM master_data_audit WHERE entity_type=$1 AND entity_id=$2 ORDER BY created_at DESC LIMIT 100", [kind, id]);
  return result.rows;
}
export async function maintenanceOptions(kind: string, search: string) {
  z.string().max(200).parse(search);
  const queries: Record<string, string> = {
    regions: "SELECT region_id AS id,name FROM regions WHERE region_id ILIKE $1 OR name ILIKE $1 ORDER BY name LIMIT 50",
    partners: "SELECT partner_id AS id,partner_name AS name FROM partners WHERE partner_id ILIKE $1 OR partner_name ILIKE $1 ORDER BY partner_name LIMIT 50",
    vendors: "SELECT v.vendor_id AS id,p.partner_name AS name FROM vendors v JOIN partners p ON p.partner_id=v.vendor_id WHERE v.role_status='ACTIVE' AND p.status='ACTIVE' AND (v.vendor_id ILIKE $1 OR p.partner_name ILIKE $1) ORDER BY p.partner_name LIMIT 50",
    locations: "SELECT location_id AS id, code || ' — ' || name AS name FROM locations WHERE is_active=true AND (location_id ILIKE $1 OR code ILIKE $1 OR name ILIKE $1) ORDER BY name LIMIT 50",
  };
  const query = queries[kind];
  if (!query) throw new Error("Danh mục không hợp lệ.");
  return (await pool.query(query, [`%${search}%`])).rows as {id: string; name: string}[];
}
export function checkTransition(status: string, action: string) {
  const allowed: Record<string, string[]> = { SAVE: ["DRAFT", "REJECTED"], SUBMIT: ["DRAFT", "REJECTED"], APPROVE: ["PENDING_APPROVAL"], REJECT: ["PENDING_APPROVAL"], RETIRE: ["APPROVED"] };
  if (!allowed[action]?.includes(status)) throw new Error("Trạng thái đã thay đổi hoặc không cho phép thao tác này. Hãy tải lại.");
}
export async function mutateMaintenance(raw: unknown, actor: CurrentActor) {
  const input = mutationSchema.parse(raw);
  const { kind, action } = input;
  requireRole(actor, kind === "rates" && ["SAVE", "SUBMIT"].includes(action) ? ["PRICING_SPECIALIST", "PRICING_MANAGER"] : ["PRICING_MANAGER"]);
  if (kind !== "rates" && action !== "SAVE") throw new Error("Thao tác không hợp lệ.");
  if (["REJECT", "RETIRE"].includes(action) && !input.comment) throw new Error("Vui lòng nhập lý do.");
  const fields = action === "SAVE" ? validateFields(kind, input.fields) : {};
  const c = catalogs[kind];
  const id = input.id ?? (kind === "rates" ? randomUUID() : `M-${randomUUID()}`);
  if (["customers", "vendors"].includes(kind) && !input.id) throw new Error("Chọn đối tác để gán vai trò.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Role writers share the partner lock with the existing lifecycle service.
    if (kind === "customers" || kind === "vendors") {
      const partner = await client.query("SELECT status FROM partners WHERE partner_id=$1 FOR UPDATE", [id]);
      if (!partner.rows.length || (fields.role_status === "ACTIVE" && partner.rows[0].status !== "ACTIVE")) throw new Error("Đối tác không tồn tại hoặc đã ngừng hoạt động.");
    }
    const old = (await client.query(`SELECT *, xmin::text AS revision FROM ${c.table} WHERE ${c.id}=$1 FOR UPDATE`, [id])).rows[0];
    if ((kind === "customers" || kind === "vendors") && fields.role_status === "SUSPENDED" && old?.role_status !== "SUSPENDED" && !input.comment) throw new Error("Tạm ngừng vai trò cần lý do thay đổi.");
    if (old && old.revision !== input.revision) throw new Error("Bản ghi đã thay đổi. Hãy tải lại trước khi lưu.");
    if (!old && (input.revision || action !== "SAVE")) throw new Error("Bản ghi không còn tồn tại.");
    if (kind === "locations") {
      if (old) requireRegionScope(actor, old.region_id ?? "");
      requireRegionScope(actor, fields.region_id!);
    }
    if (kind === "rates") {
      if (old) checkTransition(old.status, action);
      const rate = action === "SAVE" ? fields : old;
      const locations = await client.query("SELECT location_id,region_id,is_active FROM locations WHERE location_id=ANY($1::varchar[]) FOR SHARE", [[rate.pickup_location_id, rate.delivery_location_id, ...(old ? [old.pickup_location_id] : [])]]);
      for (const pickup of [rate.pickup_location_id, ...(old ? [old.pickup_location_id] : [])]) {
        requireRegionScope(actor, locations.rows.find(r => r.location_id === pickup)?.region_id ?? "");
      }
      if (action !== "RETIRE" && action !== "REJECT") {
        if (![rate.pickup_location_id, rate.delivery_location_id].every(id => locations.rows.some(r => r.location_id === id && r.is_active))) throw new Error("Điểm đi / đến phải đang hoạt động.");
        const vendor = await client.query("SELECT v.vendor_id FROM vendors v JOIN partners p ON p.partner_id=v.vendor_id WHERE v.vendor_id=$1 AND v.role_status='ACTIVE' AND p.status='ACTIVE' FOR SHARE OF v,p", [rate.vendor_id]);
        if (!vendor.rows.length) throw new Error("Nhà cung cấp chưa được kích hoạt.");
      }
      if (action === "APPROVE") {
        const author = await client.query("SELECT actor_id FROM master_data_audit WHERE entity_type='rates' AND entity_id=$1 AND action='SAVE' ORDER BY created_at DESC LIMIT 1", [id]);
        if (!author.rows.length || author.rows[0].actor_id === actor.userId) throw new Error("Giá mua cần người khác duyệt; phải có lịch sử người lập.");
      }
    }
    const values: unknown[] = [id];
    const assignments: string[] = [];
    const columns: string[] = [c.id];
    const expressions: string[] = ["$1"];
    function add(key: string, value: unknown) {
      values.push(value); columns.push(key); expressions.push(`$${values.length}`); assignments.push(`${key}=$${values.length}`);
    }
    for (const [key, value] of Object.entries(fields)) {
      if (key !== "valid_from" && key !== "valid_to") add(key, value);
    }
    if (kind === "rates") {
      if (action === "SAVE") add("validity_range", `[${fields.valid_from},${fields.valid_to})`);
      add("status", ({ SAVE: "DRAFT", SUBMIT: "PENDING_APPROVAL", APPROVE: "APPROVED", REJECT: "REJECTED", RETIRE: "INACTIVE" })[action]);
    }
    if (kind === "partners" || kind === "customers" || kind === "vendors") add("updated_at", new Date());
    if ((kind === "customers" || kind === "vendors") && fields.role_status === "ACTIVE" && old?.role_status !== "ACTIVE") {
      add("activated_by", actor.userId); add("activated_at", new Date());
    }
    const saved = await client.query(old ? `UPDATE ${c.table} SET ${assignments.join(",")} WHERE ${c.id}=$1 RETURNING *` : `INSERT INTO ${c.table} (${columns.join(",")}) VALUES (${expressions.join(",")}) RETURNING *`, values);
    await client.query("INSERT INTO master_data_audit(entity_type,entity_id,action,actor_id,actor_name,before_data,after_data,comment) VALUES($1,$2,$3,$4,$5,$6,$7,$8)", [kind, id, action, actor.userId, actor.fullName, old ? JSON.stringify(old) : null, JSON.stringify(saved.rows[0]), input.comment]);
    if (kind === "customers" || kind === "vendors") await client.query("INSERT INTO partner_role_audit_log(partner_id,role_type,action,actor_id,actor_name,previous_status,new_status,details) VALUES($1,$2,'UPDATE',$3,$4,$5,$6,$7)", [id, kind === "customers" ? "CUSTOMER" : "VENDOR", actor.userId, actor.fullName, old?.role_status ?? null, fields.role_status, JSON.stringify(fields)]);
    await client.query("COMMIT");
    return id;
  } catch (error) {
    await client.query("ROLLBACK");
    const code = (error as {code?: string}).code;
    if (code === "23P01") throw new Error("Khoảng hiệu lực trùng giá đã duyệt của cùng NCC, tuyến và thiết bị.");
    if (code === "23505") throw new Error("Mã đã tồn tại. Hãy tải lại và kiểm tra dữ liệu.");
    if (code === "23503") throw new Error("Dữ liệu tham chiếu không tồn tại. Hãy tải lại danh mục.");
    throw error;
  } finally { client.release(); }
}
