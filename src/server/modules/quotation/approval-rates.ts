import type { PoolClient } from "pg";
import Decimal from "decimal.js";
import { lookupRoadRates } from "@/server/modules/supplier-pricing/rate-lookup.service";
import { getBusinessDate } from "@/shared/utils/pricing";

export async function validateApprovalRates(client: PoolClient, quotationId: string) {
  const lines = await client.query(`SELECT i.service_package,i.origin_location_id,i.destination_location_id,i.equipment_type,i.selected_buy_rate_id,
    s.rate_amount,s.original_currency,s.fx_rate_to_vnd
    FROM quotation_service_items i LEFT JOIN quotation_buy_snapshots s ON s.item_id=i.item_id AND s.quotation_id=i.quotation_id
    WHERE i.quotation_id=$1`,[quotationId]);
  if (!lines.rows.length) throw new Error("Báo giá không có dòng dịch vụ.");
  for (const line of lines.rows) {
    if (line.service_package === "PORT") {
      const portRateRes = await client.query(
        `SELECT rate_id, unit_price, currency, status, validity_range @> $2::date as is_valid
         FROM port_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, getBusinessDate()]
      );
      const pr = portRateRes.rows[0];
      const fxRate = pr?.currency === "USD" ? 25700 : 1.0;
      if (!pr || pr.status !== "ACTIVE" || !pr.is_valid || line.rate_amount == null || !new Decimal(line.rate_amount).eq(pr.unit_price) || line.original_currency !== pr.currency || !new Decimal(line.fx_rate_to_vnd).eq(fxRate)) {
        throw new Error("Biểu phí cảng đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }
      continue;
    }

    if (line.service_package === "BORDER_GATE") {
      const borderRateRes = await client.query(
        `SELECT rate_id, total_fee, currency, status, validity_range @> $2::date as is_valid
         FROM border_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, getBusinessDate()]
      );
      const br = borderRateRes.rows[0];
      const fxRate = 1.0;
      if (!br || br.status !== "ACTIVE" || !br.is_valid || line.rate_amount == null || !new Decimal(line.rate_amount).eq(br.total_fee) || line.original_currency !== (br.currency || "VND") || !new Decimal(line.fx_rate_to_vnd).eq(fxRate)) {
        throw new Error("Biểu phí cửa khẩu đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }
      continue;
    }

    if (line.service_package === "OCEAN") {
      const oceanRateRes = await client.query(
        `SELECT rate_id, total_charges_vnd, currency, status, validity_range @> $2::date as is_valid
         FROM ocean_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, getBusinessDate()]
      );
      const or = oceanRateRes.rows[0];
      const fxRate = 1.0;
      if (!or || or.status !== "ACTIVE" || !or.is_valid || line.rate_amount == null || !new Decimal(line.rate_amount).eq(or.total_charges_vnd) || line.original_currency !== "VND" || !new Decimal(line.fx_rate_to_vnd).eq(fxRate)) {
        throw new Error("Biểu cước vận tải biển đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }
      continue;
    }

    if (line.service_package === "CUSTOMS") {
      const customsRes = await client.query(
        `SELECT rate_id, total_service_fee, customs_fee, currency, status, validity_range @> $2::date as is_valid
         FROM customs_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, getBusinessDate()]
      );
      const cr = customsRes.rows[0];
      const fee = cr ? Number(cr.total_service_fee || cr.customs_fee || 0) : 0;
      if (!cr || cr.status !== "ACTIVE" || !cr.is_valid || line.rate_amount == null || !new Decimal(line.rate_amount).eq(fee)) {
        throw new Error("Biểu phí hải quan đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }
      continue;
    }

    if (line.service_package === "WAREHOUSING") {
      const whRes = await client.query(
        `SELECT rate_id, unit_price, currency, status, validity_range @> $2::date as is_valid
         FROM warehouse_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, getBusinessDate()]
      );
      const wr = whRes.rows[0];
      if (!wr || wr.status !== "ACTIVE" || !wr.is_valid || line.rate_amount == null || !new Decimal(line.rate_amount).eq(wr.unit_price)) {
        throw new Error("Biểu phí kho bãi đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }
      continue;
    }

    if (line.service_package === "INSURANCE") {
      const insRes = await client.query(
        `SELECT rate_id, unit_price, rate_percent, pricing_model, min_premium_vnd, currency, status, validity_range @> $2::date as is_valid
         FROM insurance_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, getBusinessDate()]
      );
      const ir = insRes.rows[0];
      if (!ir || ir.status !== "ACTIVE" || !ir.is_valid || line.rate_amount == null) {
        throw new Error("Biểu phí bảo hiểm đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }
      continue;
    }

    if (line.service_package === "OTHER") {
      const otherRes = await client.query(
        `SELECT rate_id, unit_price, currency, status, validity_range @> $2::date as is_valid
         FROM other_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, getBusinessDate()]
      );
      const or = otherRes.rows[0];
      if (!or || or.status !== "ACTIVE" || !or.is_valid || line.rate_amount == null || !new Decimal(line.rate_amount).eq(or.unit_price)) {
        throw new Error("Biểu phí dịch vụ khác đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }
      continue;
    }

    const rates = await lookupRoadRates({pickupLocationId:line.origin_location_id,deliveryLocationId:line.destination_location_id,equipmentType:line.equipment_type,pricingDate:getBusinessDate()},client);
    const selected = rates.candidates.find(rate=>rate.rateId===line.selected_buy_rate_id);
    if (rates.status === "CONFLICT_RATE" || !selected || line.rate_amount == null || !new Decimal(line.rate_amount).eq(selected.buyRate) || line.original_currency!==selected.currency || !new Decimal(line.fx_rate_to_vnd).eq(selected.fxRateToVnd)) {
      throw new Error("Giá mua đã thay đổi, hết hiệu lực hoặc NCC ngừng hoạt động. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
    }
  }
}
