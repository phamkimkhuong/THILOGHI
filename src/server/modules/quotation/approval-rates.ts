import type { PoolClient } from "pg";
import Decimal from "decimal.js";
import { lookupRoadRates } from "@/server/modules/supplier-pricing/rate-lookup.service";
import { getBusinessDate } from "@/shared/utils/pricing";

export async function validateApprovalRates(client: PoolClient, quotationId: string) {
  const lines = await client.query(`SELECT i.origin_location_id,i.destination_location_id,i.equipment_type,i.selected_buy_rate_id,
    s.rate_amount,s.original_currency,s.fx_rate_to_vnd
    FROM quotation_service_items i LEFT JOIN quotation_buy_snapshots s ON s.item_id=i.item_id AND s.quotation_id=i.quotation_id
    WHERE i.quotation_id=$1`,[quotationId]);
  if (!lines.rows.length) throw new Error("Báo giá không có dòng dịch vụ.");
  for (const line of lines.rows) {
    const rates = await lookupRoadRates({pickupLocationId:line.origin_location_id,deliveryLocationId:line.destination_location_id,equipmentType:line.equipment_type,pricingDate:getBusinessDate()},client);
    const selected = rates.candidates.find(rate=>rate.rateId===line.selected_buy_rate_id);
    if (rates.status === "CONFLICT_RATE" || !selected || line.rate_amount == null || !new Decimal(line.rate_amount).eq(selected.buyRate) || line.original_currency!==selected.currency || !new Decimal(line.fx_rate_to_vnd).eq(selected.fxRateToVnd)) {
      throw new Error("Giá mua đã thay đổi, hết hiệu lực hoặc NCC ngừng hoạt động. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
    }
  }
}
