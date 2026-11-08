import { pool } from "@/server/db";
import { requireRegionScope, requireRole } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";
import { z } from "zod";

export async function createQuotationVersion(id: string, revision: string, actor: CurrentActor) {
  z.string().uuid().parse(id);
  z.string().min(1).max(100).parse(revision);
  requireRole(actor, ["SALES", "PRICING_SPECIALIST", "PRICING_MANAGER"]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const source = (await client.query("SELECT *, updated_at::text AS revision FROM customer_quotations WHERE quotation_id=$1 FOR UPDATE", [id])).rows[0];
    if (!source) throw new Error("Không tìm thấy báo giá.");
    requireRegionScope(actor, source.region_id);
    if (source.revision !== revision) throw new Error("Báo giá đã thay đổi. Vui lòng tải lại.");
    if (source.status !== "APPROVED" || !source.immutable_locked) throw new Error("Chỉ tạo phiên bản mới từ bản đã duyệt.");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [source.quotation_no]);
    const latest = (await client.query("SELECT MAX(version) AS version FROM customer_quotations WHERE quotation_no=$1", [source.quotation_no])).rows[0];
    if (Number(latest.version) !== Number(source.version)) throw new Error("Đã có phiên bản mới hơn. Hãy mở phiên bản mới nhất trong danh sách.");
    const result = await client.query(`INSERT INTO customer_quotations
      (quotation_no,version,customer_id,customer_name_snapshot,customer_tax_code_snapshot,customer_address_snapshot,region_id,commodity_id,status,total_sell_amount,total_estimated_buy,total_worst_case_buy,estimated_gp,estimated_margin_percent,currency,payment_terms_days,pricing_date,valid_until,created_by,created_by_user_id,immutable_locked)
      SELECT quotation_no,version+1,customer_id,customer_name_snapshot,customer_tax_code_snapshot,customer_address_snapshot,region_id,commodity_id,'DRAFT',total_sell_amount,0,0,total_sell_amount,CASE WHEN total_sell_amount>0 THEN 100 ELSE 0 END,currency,payment_terms_days,pricing_date,valid_until,$2,$3,false
      FROM customer_quotations WHERE quotation_id=$1 RETURNING quotation_id`, [id, `${actor.fullName} (${actor.role})`, actor.userId]);
    const newId = result.rows[0].quotation_id as string;
    await client.query(`INSERT INTO quotation_service_items
      (quotation_id,service_package,pricing_inclusion,origin_location_id,destination_location_id,equipment_type,planned_quantity,unit,unit_sell_price,total_sell_price,insured_value,item_gp,item_margin_percent)
      SELECT $2,service_package,pricing_inclusion,origin_location_id,destination_location_id,equipment_type,planned_quantity,unit,unit_sell_price,total_sell_price,insured_value,total_sell_price,CASE WHEN total_sell_price>0 THEN 100 ELSE 0 END
      FROM quotation_service_items WHERE quotation_id=$1 ORDER BY created_at,item_id`, [id, newId]);
    await client.query("INSERT INTO quotation_approval_log(quotation_id,version,action,actor_id,actor_name,comment) VALUES($1,$2,'NEW_VERSION',$3,$4,$5)", [newId, Number(source.version)+1, actor.userId, actor.fullName, `Tạo từ phiên bản ${source.version}; cần chọn lại giá mua hiện hành.`]);
    await client.query("COMMIT");
    return newId;
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
