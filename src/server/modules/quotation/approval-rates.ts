import type { PoolClient } from "pg";
import Decimal from "decimal.js";
import { lookupRoadRates } from "@/server/modules/supplier-pricing/rate-lookup.service";
import { getBusinessDate, getFxRateToVnd } from "@/shared/utils/pricing";

export async function validateApprovalRates(
  client: PoolClient,
  quotationId: string,
  pricingDateOverride?: string | Date
) {
  let pricingDate: string = "";
  if (pricingDateOverride) {
    if (pricingDateOverride instanceof Date) {
      pricingDate = pricingDateOverride.toISOString().slice(0, 10);
    } else {
      pricingDate = String(pricingDateOverride).slice(0, 10);
    }
  }
  if (!pricingDate) {
    try {
      const qRes = await client.query(
        `SELECT COALESCE(pricing_date::text, created_at::date::text) as pricing_date FROM customer_quotations WHERE quotation_id = $1`,
        [quotationId]
      );
      pricingDate = (qRes.rows[0]?.pricing_date as string | undefined) || getBusinessDate();
    } catch {
      pricingDate = getBusinessDate();
    }
  }
  if (!pricingDate) {
    pricingDate = getBusinessDate();
  }

  const lines = await client.query(
    `SELECT i.item_id, i.service_package, i.origin_location_id, i.destination_location_id, i.equipment_type, i.selected_buy_rate_id,
            i.insured_value, i.estimated_buy_amount,
            s.rate_amount, s.original_currency, s.fx_rate_to_vnd
     FROM quotation_service_items i
     LEFT JOIN quotation_buy_snapshots s ON s.item_id = i.item_id AND s.quotation_id = i.quotation_id
     WHERE i.quotation_id = $1`,
    [quotationId]
  );
  if (!lines.rows.length) throw new Error("Báo giá không có dòng dịch vụ.");

  for (const line of lines.rows) {
    if (!line.selected_buy_rate_id) continue;

    // 1. Kiểm tra nếu có chi tiết cấu phần chi phí (Cost Components)
    let compRows: Array<{
      component_id: string;
      cost_code: string;
      cost_name: string;
      is_required: boolean;
      rate_source_id: string | null;
      original_currency: string;
      original_rate: number;
      fx_rate_to_vnd: number;
      estimated_cost_vnd: number;
    }> = [];

    if (line.item_id) {
      try {
        const compRes = await client.query(
          `SELECT component_id, cost_code, cost_name, is_required, rate_source_id,
                  original_currency, original_rate, fx_rate_to_vnd, estimated_cost_vnd
           FROM quotation_item_cost_components
           WHERE quotation_id = $1 AND item_id = $2`,
          [quotationId, line.item_id]
        );
        compRows = compRes.rows || [];
      } catch {
        compRows = [];
      }
    }

    if (compRows.length > 0) {
      for (const comp of compRows) {
        if (!comp.rate_source_id) continue;

        if (line.service_package === "PORT") {
          const portRateRes = await client.query(
            `SELECT rate_id, unit_price, currency, status, validity_range @> $2::date as is_valid
             FROM port_rates WHERE rate_id = $1`,
            [comp.rate_source_id, pricingDate]
          );
          const pr = portRateRes.rows[0];
          const fxRate = pr ? getFxRateToVnd(pr.currency || "VND") : 1.0;
          if (
            !pr ||
            pr.status !== "ACTIVE" ||
            !pr.is_valid ||
            comp.original_rate == null ||
            !new Decimal(comp.original_rate).eq(pr.unit_price) ||
            comp.original_currency !== (pr.currency || "VND") ||
            !new Decimal(comp.fx_rate_to_vnd).eq(fxRate)
          ) {
            throw new Error(
              `Biểu phí cảng [${comp.cost_name}] đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.`
            );
          }
        } else if (line.service_package === "BORDER_GATE") {
          const borderRateRes = await client.query(
            `SELECT rate_id, infrastructure_fee, entry_exit_fee, customs_fee, total_fee, currency, status, validity_range @> $2::date as is_valid
             FROM border_rates WHERE rate_id = $1`,
            [comp.rate_source_id, pricingDate]
          );
          const br = borderRateRes.rows[0];
          const fxRate = br ? getFxRateToVnd(br.currency || "VND") : 1.0;
          let expectedRate = Number(br?.total_fee || 0);
          if (comp.cost_code === "INFRASTRUCTURE_FEE") expectedRate = Number(br?.infrastructure_fee || 0);
          else if (comp.cost_code === "ENTRY_EXIT_FEE") expectedRate = Number(br?.entry_exit_fee || 0);
          else if (comp.cost_code === "CUSTOMS_FEE") expectedRate = Number(br?.customs_fee || 0);

          if (
            !br ||
            br.status !== "ACTIVE" ||
            !br.is_valid ||
            comp.original_rate == null ||
            !new Decimal(comp.original_rate).eq(expectedRate) ||
            comp.original_currency !== (br.currency || "VND") ||
            !new Decimal(comp.fx_rate_to_vnd).eq(fxRate)
          ) {
            throw new Error(
              `Biểu phí cửa khẩu [${comp.cost_name}] đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.`
            );
          }
        } else if (line.service_package === "OCEAN") {
          const oceanRateRes = await client.query(
            `SELECT rate_id, ocean_freight_usd, thc_fee, docs_fee, seal_fee, afs_fee, telex_fee, baf_caf_fee, other_surcharges, total_charges_vnd, currency, status, validity_range @> $2::date as is_valid
             FROM ocean_rates WHERE rate_id = $1`,
            [comp.rate_source_id, pricingDate]
          );
          const or = oceanRateRes.rows[0];
          if (!or || or.status !== "ACTIVE" || !or.is_valid) {
            throw new Error(
              `Biểu cước vận tải biển [${comp.cost_name}] đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.`
            );
          }
          if (comp.cost_code === "OCEAN_FREIGHT") {
            const usdFx = getFxRateToVnd("USD");
            if (
              !new Decimal(comp.original_rate).eq(or.ocean_freight_usd) ||
              comp.original_currency !== "USD" ||
              !new Decimal(comp.fx_rate_to_vnd).eq(usdFx)
            ) {
              throw new Error(
                "Cước biển quốc tế USD hoặc tỷ giá đã thay đổi. Trả báo giá về nháp để tra lại giá trước khi duyệt."
              );
            }
          } else if (comp.cost_code === "LOCAL_CHARGES") {
            const expectedLocal =
              Number(or.thc_fee || 0) +
              Number(or.docs_fee || 0) +
              Number(or.seal_fee || 0) +
              Number(or.afs_fee || 0) +
              Number(or.telex_fee || 0) +
              Number(or.baf_caf_fee || 0) +
              Number(or.other_surcharges || 0);
            if (
              !new Decimal(comp.original_rate).eq(expectedLocal) ||
              comp.original_currency !== "VND"
            ) {
              throw new Error(
                "Phụ phí địa phương / bến bãi cảng biển đã thay đổi. Trả báo giá về nháp để tra lại giá trước khi duyệt."
              );
            }
          }
        } else if (line.service_package === "CUSTOMS") {
          const customsRes = await client.query(
            `SELECT rate_id, unit_price, currency, status, validity_range @> $2::date as is_valid
             FROM customs_rates WHERE rate_id = $1`,
            [comp.rate_source_id, pricingDate]
          );
          const cr = customsRes.rows[0];
          const fxRate = cr ? getFxRateToVnd(cr.currency || "VND") : 1.0;
          if (
            !cr ||
            cr.status !== "ACTIVE" ||
            !cr.is_valid ||
            comp.original_rate == null ||
            !new Decimal(comp.original_rate).eq(cr.unit_price) ||
            comp.original_currency !== (cr.currency || "VND") ||
            !new Decimal(comp.fx_rate_to_vnd).eq(fxRate)
          ) {
            throw new Error(
              `Biểu phí hải quan [${comp.cost_name}] đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.`
            );
          }
        } else if (line.service_package === "WAREHOUSING") {
          const whRes = await client.query(
            `SELECT rate_id, unit_price, currency, status, validity_range @> $2::date as is_valid
             FROM warehouse_rates WHERE rate_id = $1`,
            [comp.rate_source_id, pricingDate]
          );
          const wr = whRes.rows[0];
          const fxRate = wr ? getFxRateToVnd(wr.currency || "VND") : 1.0;
          if (
            !wr ||
            wr.status !== "ACTIVE" ||
            !wr.is_valid ||
            comp.original_rate == null ||
            !new Decimal(comp.original_rate).eq(wr.unit_price) ||
            comp.original_currency !== (wr.currency || "VND") ||
            !new Decimal(comp.fx_rate_to_vnd).eq(fxRate)
          ) {
            throw new Error(
              `Biểu phí kho bãi [${comp.cost_name}] đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.`
            );
          }
        } else if (line.service_package === "INSURANCE") {
          const insRes = await client.query(
            `SELECT rate_id, unit_price, rate_percent, pricing_model, min_premium_vnd, currency, status, validity_range @> $2::date as is_valid
             FROM insurance_rates WHERE rate_id = $1`,
            [comp.rate_source_id, pricingDate]
          );
          const ir = insRes.rows[0];
          const fxRate = ir ? getFxRateToVnd(ir.currency || "VND") : 1.0;
          if (
            !ir ||
            ir.status !== "ACTIVE" ||
            !ir.is_valid ||
            comp.original_rate == null ||
            comp.original_currency !== (ir.currency || "VND") ||
            !new Decimal(comp.fx_rate_to_vnd).eq(fxRate)
          ) {
            throw new Error(
              "Biểu phí bảo hiểm đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt."
            );
          }
          let expectedRate = Number(ir.unit_price || 0);
          if (ir.pricing_model === "PERCENT_OF_VALUE" && line.insured_value) {
            const calculated = (Number(line.insured_value) * Number(ir.rate_percent || 0)) / 100;
            expectedRate = Math.max(calculated, Number(ir.min_premium_vnd || 0));
          }
          if (!new Decimal(comp.original_rate).eq(expectedRate)) {
            throw new Error(
              "Đơn giá bảo hiểm đã thay đổi so với tỷ lệ áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt."
            );
          }
        } else if (line.service_package === "OTHER") {
          const otherRes = await client.query(
            `SELECT rate_id, unit_price, currency, status, validity_range @> $2::date as is_valid
             FROM other_rates WHERE rate_id = $1`,
            [comp.rate_source_id, pricingDate]
          );
          const or = otherRes.rows[0];
          const fxRate = or ? getFxRateToVnd(or.currency || "VND") : 1.0;
          if (
            !or ||
            or.status !== "ACTIVE" ||
            !or.is_valid ||
            comp.original_rate == null ||
            !new Decimal(comp.original_rate).eq(or.unit_price) ||
            comp.original_currency !== (or.currency || "VND") ||
            !new Decimal(comp.fx_rate_to_vnd).eq(fxRate)
          ) {
            throw new Error(
              `Biểu phí dịch vụ khác [${comp.cost_name}] đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.`
            );
          }
        } else {
          // TRUCKING
          const rates = await lookupRoadRates(
            {
              pickupLocationId: line.origin_location_id,
              deliveryLocationId: line.destination_location_id,
              equipmentType: line.equipment_type,
              pricingDate,
            },
            client
          );
          const selected = rates.candidates.find((rate) => rate.rateId === comp.rate_source_id);
          if (
            rates.status === "CONFLICT_RATE" ||
            !selected ||
            comp.original_rate == null ||
            !new Decimal(comp.original_rate).eq(selected.buyRate) ||
            comp.original_currency !== selected.currency ||
            !new Decimal(comp.fx_rate_to_vnd).eq(selected.fxRateToVnd)
          ) {
            throw new Error(
              "Giá mua đã thay đổi, hết hiệu lực hoặc NCC ngừng hoạt động. Trả báo giá về nháp để tra lại giá trước khi duyệt."
            );
          }
        }
      }

      // Kiểm tra tính nhất quán tổng BUY của các cấu phần bắt buộc
      const requiredTotal = compRows
        .filter((c) => c.is_required)
        .reduce((sum, c) => sum + Number(c.estimated_cost_vnd || 0), 0);
      if (line.estimated_buy_amount != null && !new Decimal(line.estimated_buy_amount).eq(requiredTotal)) {
        throw new Error(
          "Tổng cấu phần chi phí bắt buộc không khớp với giá mua đã lưu. Trả báo giá về nháp để tính lại giá trước khi duyệt."
        );
      }

      continue;
    }

    // 2. Fallback Revalidation cho dữ liệu cũ (Legacy records) hoặc mock test chưa có bảng cấu phần
    if (line.service_package === "PORT") {
      const portRateRes = await client.query(
        `SELECT rate_id, unit_price, currency, status, validity_range @> $2::date as is_valid
         FROM port_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, pricingDate]
      );
      const pr = portRateRes.rows[0];
      const fxRate = pr ? getFxRateToVnd(pr.currency || "VND") : 1.0;
      if (!pr || pr.status !== "ACTIVE" || !pr.is_valid || line.rate_amount == null || !new Decimal(line.rate_amount).eq(pr.unit_price) || line.original_currency !== pr.currency || !new Decimal(line.fx_rate_to_vnd).eq(fxRate)) {
        throw new Error("Biểu phí cảng đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }
      continue;
    }

    if (line.service_package === "BORDER_GATE") {
      const borderRateRes = await client.query(
        `SELECT rate_id, total_fee, currency, status, validity_range @> $2::date as is_valid
         FROM border_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, pricingDate]
      );
      const br = borderRateRes.rows[0];
      const fxRate = br ? getFxRateToVnd(br.currency || "VND") : 1.0;
      if (!br || br.status !== "ACTIVE" || !br.is_valid || line.rate_amount == null || !new Decimal(line.rate_amount).eq(br.total_fee) || line.original_currency !== (br.currency || "VND") || !new Decimal(line.fx_rate_to_vnd).eq(fxRate)) {
        throw new Error("Biểu phí cửa khẩu đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }
      continue;
    }

    if (line.service_package === "OCEAN") {
      const oceanRateRes = await client.query(
        `SELECT rate_id, total_charges_vnd, currency, status, validity_range @> $2::date as is_valid
         FROM ocean_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, pricingDate]
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
        `SELECT rate_id, unit_price, currency, status, validity_range @> $2::date as is_valid
         FROM customs_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, pricingDate]
      );
      const cr = customsRes.rows[0];
      const fxRate = cr ? getFxRateToVnd(cr.currency || "VND") : 1.0;
      if (!cr || cr.status !== "ACTIVE" || !cr.is_valid || line.rate_amount == null || !new Decimal(line.rate_amount).eq(cr.unit_price) || line.original_currency !== (cr.currency || "VND") || !new Decimal(line.fx_rate_to_vnd).eq(fxRate)) {
        throw new Error("Biểu phí hải quan đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }
      continue;
    }

    if (line.service_package === "WAREHOUSING") {
      const whRes = await client.query(
        `SELECT rate_id, unit_price, currency, status, validity_range @> $2::date as is_valid
         FROM warehouse_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, pricingDate]
      );
      const wr = whRes.rows[0];
      const fxRate = wr ? getFxRateToVnd(wr.currency || "VND") : 1.0;
      if (!wr || wr.status !== "ACTIVE" || !wr.is_valid || line.rate_amount == null || !new Decimal(line.rate_amount).eq(wr.unit_price) || line.original_currency !== (wr.currency || "VND") || !new Decimal(line.fx_rate_to_vnd).eq(fxRate)) {
        throw new Error("Biểu phí kho bãi đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }
      continue;
    }

    if (line.service_package === "INSURANCE") {
      const insRes = await client.query(
        `SELECT rate_id, unit_price, rate_percent, pricing_model, min_premium_vnd, currency, status, validity_range @> $2::date as is_valid
         FROM insurance_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, pricingDate]
      );
      const ir = insRes.rows[0];
      const fxRate = ir ? getFxRateToVnd(ir.currency || "VND") : 1.0;
      if (!ir || ir.status !== "ACTIVE" || !ir.is_valid || line.rate_amount == null || line.original_currency !== (ir.currency || "VND") || !new Decimal(line.fx_rate_to_vnd).eq(fxRate)) {
        throw new Error("Biểu phí bảo hiểm đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }

      let expectedRate = Number(ir.unit_price || 0);
      if (ir.pricing_model === "PERCENT_OF_VALUE" && line.insured_value) {
        const calculated = (Number(line.insured_value) * Number(ir.rate_percent || 0)) / 100;
        expectedRate = Math.max(calculated, Number(ir.min_premium_vnd || 0));
      }
      if (!new Decimal(line.rate_amount).eq(expectedRate)) {
        throw new Error("Đơn giá bảo hiểm đã thay đổi so với tỷ lệ áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }
      continue;
    }

    if (line.service_package === "OTHER") {
      const otherRes = await client.query(
        `SELECT rate_id, unit_price, currency, status, validity_range @> $2::date as is_valid
         FROM other_rates WHERE rate_id = $1`,
        [line.selected_buy_rate_id, pricingDate]
      );
      const or = otherRes.rows[0];
      const fxRate = or ? getFxRateToVnd(or.currency || "VND") : 1.0;
      if (!or || or.status !== "ACTIVE" || !or.is_valid || line.rate_amount == null || !new Decimal(line.rate_amount).eq(or.unit_price) || line.original_currency !== (or.currency || "VND") || !new Decimal(line.fx_rate_to_vnd).eq(fxRate)) {
        throw new Error("Biểu phí dịch vụ khác đã thay đổi, hết hiệu lực hoặc ngừng áp dụng. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
      }
      continue;
    }

    const rates = await lookupRoadRates({pickupLocationId:line.origin_location_id,deliveryLocationId:line.destination_location_id,equipmentType:line.equipment_type,pricingDate},client);
    const selected = rates.candidates.find(rate=>rate.rateId===line.selected_buy_rate_id);
    if (rates.status === "CONFLICT_RATE" || !selected || line.rate_amount == null || !new Decimal(line.rate_amount).eq(selected.buyRate) || line.original_currency!==selected.currency || !new Decimal(line.fx_rate_to_vnd).eq(selected.fxRateToVnd)) {
      throw new Error("Giá mua đã thay đổi, hết hiệu lực hoặc NCC ngừng hoạt động. Trả báo giá về nháp để tra lại giá trước khi duyệt.");
    }
  }
}
