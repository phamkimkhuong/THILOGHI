"use server";
import { requireAuth, requireRegionScope } from "@/server/auth/authorize";
import { createQuotationVersion } from "@/server/modules/quotation/version.service";
import { pool } from "@/server/db";
import { commercialSheetSchema } from "./commercial-sheet";
import { z } from "zod";
export async function createQuotationVersionAction(id: string, revision: string) {
  try { return { success: true as const, id: await createQuotationVersion(id, revision, await requireAuth()) }; }
  catch (error) { return { success: false as const, error: error instanceof Error ? error.message : "Không tạo được phiên bản mới." }; }
}
export async function getCommercialSheetAction(id: string) {
  try {
    const actor = await requireAuth();
    z.string().uuid().parse(id);
    const q = (await pool.query("SELECT region_id,status,commercial_snapshot,approved_at FROM customer_quotations WHERE quotation_id=$1", [id])).rows[0];
    if (!q) throw new Error("Không tìm thấy báo giá.");
    requireRegionScope(actor, q.region_id);
    if (q.status !== "APPROVED" && q.status !== "SUPERSEDED") throw new Error("Chỉ in bản thương mại đã được duyệt.");
    if (!q.commercial_snapshot) throw new Error("Chưa có bản chụp thương mại. Cần kiểm tra migration đợt 4.");
    return { success: true as const, sheet: commercialSheetSchema.parse(q.commercial_snapshot), superseded: q.status === "SUPERSEDED", approvedAt: q.approved_at ? new Date(q.approved_at).toISOString() : null };
  } catch (error) { return { success: false as const, error: error instanceof Error ? error.message : "Không tải được bản in." }; }
}
