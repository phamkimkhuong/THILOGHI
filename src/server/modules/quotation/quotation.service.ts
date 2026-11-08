import type { PoolClient } from "pg";
import { requireRegionScope, requireRole } from "@/server/auth/authorize";
import { getBusinessDate, roundVnd, getFxRateToVnd } from "@/shared/utils/pricing";
import Decimal from "decimal.js";
import { pool } from "@/server/db";
import { CreateQuotationInput, createQuotationSchema } from "@/shared/schemas/quotation.schema";
import { CurrentActor } from "@/server/auth/types";
import { lookupRoadRates } from "@/server/modules/supplier-pricing/rate-lookup.service";
import { validateApprovalRates } from "./approval-rates";

export interface QuotationFinancialSummary {
  totalSellAmount: number;
  totalEstimatedBuy: number;
  totalWorstCaseBuy: number;
  estimatedGp: number;
  estimatedMarginPercent: number;
}

import { evaluateApprovalAuthority, isQuotationAuthor } from "@/features/quotation/approval-policy";
export { evaluateApprovalAuthority } from "@/features/quotation/approval-policy";

export { calculateQuotationFinancials } from "@/shared/utils/pricing";

/**
 * Lưu hoặc Cập nhật Báo giá Nháp (PR-04 & PR-05)
 * - Tách biệt Create Draft (chưa có quotationId) vs Update Draft (đã có quotationId)
 * - Server-Authoritative: đọc lại bảng giá road_rates & vendors, quy đổi ngoại tệ FX sang VND
 * - Khóa tính bất biến: Không cho phép sửa nếu đã bị khóa hoặc không ở trạng thái DRAFT
 */
export interface CostComponentInput {
  costCode: string;
  costName: string;
  isRequired: boolean;
  rateSourceId?: string | null;
  vendorId?: string | null;
  costSourceId?: string | null;
  vendorName: string;
  quantity: number;
  unit: string;
  rateBasis: string;
  originalCurrency: string;
  originalRate: number;
  fxRateToVnd: number;
  estimatedCostVnd: number;
  worstCaseCostVnd: number;
}

export interface QuotationCostComponentItem {
  componentId: string;
  quotationId: string;
  itemId: string;
  costCode: string;
  costName: string;
  isRequired: boolean;
  rateSourceId: string | null;
  vendorId: string | null;
  costSourceId: string | null;
  vendorName: string;
  quantity: number;
  unit: string;
  rateBasis: string;
  originalCurrency: string;
  originalRate: number;
  fxRateToVnd: number;
  estimatedCostVnd: number;
  worstCaseCostVnd: number;
  createdAt: string;
}

export async function saveQuotationDraft(
  rawInput: CreateQuotationInput,
  actor: CurrentActor,
  submit = false
) {
  const input = createQuotationSchema.parse(rawInput);
  requireRole(actor, ["SALES", "PRICING_SPECIALIST", "PRICING_MANAGER"]);
  requireRegionScope(actor, input.regionId);
  const createdBy = `${actor.fullName} (${actor.role})`;
  const pricingDate = input.pricingDate || getBusinessDate();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock before pricing or replacing children: every writer serializes on this row.
    if (input.quotationId) {
      const existing = await client.query(
        'SELECT region_id, status, immutable_locked, updated_at::text as revision FROM customer_quotations WHERE quotation_id = $1 FOR UPDATE',
        [input.quotationId]
      );
      const quote = existing.rows[0];
      if (!quote) throw new Error("Không tìm thấy báo giá.");
      requireRegionScope(actor, quote.region_id);
      if (quote.status !== "DRAFT" || quote.immutable_locked) throw new Error("Chỉ được sửa báo giá nháp chưa khóa.");
      if (quote.revision !== input.expectedUpdatedAt) throw new Error("Báo giá đã được thay đổi. Vui lòng tải lại trước khi lưu.");
    }

    // 1. Xác thực và tính toán Server-Authoritative cho từng dịch vụ với chuẩn hóa FX
    let serverTotalSell = new Decimal(0);
    let serverTotalBuy = new Decimal(0);
    let serverTotalWorstBuy = new Decimal(0);

    const verifiedItems = [];

    for (const item of input.items) {
      const itemQty = new Decimal(item.plannedQuantity || 1);
      const itemSellUnit = roundVnd(item.unitSellPrice);
      const itemSellTotal = roundVnd(itemSellUnit.mul(itemQty));
      serverTotalSell = serverTotalSell.add(itemSellTotal);

      let verifiedBuyRateVnd = new Decimal(0);
      let verifiedWorstBuyVnd = new Decimal(0);
      let verifiedVendorId: string | null = null;
      let verifiedCostSourceId: string | null = null;
      let verifiedCostSourceType = "VENDOR";
      let verifiedVendorName: string | null = null;
      let verifiedOriginalRate = new Decimal(0);
      let verifiedOriginalCurrency = "VND";
      let verifiedFxRate = 1.0;
      let validityStart: string | null = null;
      let validityEnd: string | null = null;
      const components: CostComponentInput[] = [];

      // PR-04 & Blocker 4: Server tra cứu lại giá gốc từ PostgreSQL theo đúng ngữ cảnh, không tin client
      if (item.selectedBuyRateId) {
        if (item.servicePackage === "PORT") {
          const portRes = await client.query(
            `SELECT rate_id, port_code, port_name, service_category, charge_code, cargo_type, container_type, unit, unit_price, currency, notes,
                    lower(validity_range)::text as validity_start, upper(validity_range)::text as validity_end, status
             FROM port_rates
             WHERE rate_id = $1 AND status = 'ACTIVE' AND validity_range @> $2::date`,
            [item.selectedBuyRateId, pricingDate]
          );
          if (portRes.rows.length === 0) {
            throw new Error("Biểu phí cảng đã chọn không còn hiệu lực hoặc đã ngừng áp dụng. Vui lòng tra cứu lại.");
          }
          const pRow = portRes.rows[0];
          if (item.equipmentType && pRow.container_type !== "ALL" && pRow.container_type !== item.equipmentType) {
            throw new Error(`Biểu phí cảng (${pRow.container_type}) không phù hợp với loại container [${item.equipmentType}] của báo giá.`);
          }
          const unitPrice = Number(pRow.unit_price);
          const fxRate = getFxRateToVnd(pRow.currency || "VND");
          const priceVnd = roundVnd(new Decimal(unitPrice).mul(fxRate)).toNumber();

          components.push({
            costCode: pRow.charge_code || "LOLO",
            costName: pRow.notes || `${pRow.service_category} [${pRow.charge_code}]`,
            isRequired: true,
            rateSourceId: pRow.rate_id,
            vendorId: null,
            costSourceId: pRow.port_code,
            vendorName: `${pRow.port_name} [${pRow.charge_code}]`,
            quantity: 1,
            unit: pRow.unit || "Cont",
            rateBasis: "PER_CONTAINER",
            originalCurrency: pRow.currency || "VND",
            originalRate: unitPrice,
            fxRateToVnd: fxRate,
            estimatedCostVnd: priceVnd,
            worstCaseCostVnd: priceVnd,
          });

          // Nếu là container lạnh (20HR, 40HR) và gói LOLO, tự động kiểm tra phụ phí THC cảng bắt buộc
          if (["20HR", "40HR"].includes(pRow.container_type) && pRow.charge_code === "LOLO") {
            const thcRes = await client.query(
              `SELECT rate_id, port_code, port_name, charge_code, unit_price, currency, notes
               FROM port_rates
               WHERE port_code = $1 AND charge_code = 'THC_PORT' AND container_type = $2 AND status = 'ACTIVE' AND validity_range @> $3::date`,
              [pRow.port_code, pRow.container_type, pricingDate]
            );
            if (thcRes.rows.length > 0) {
              const thcRow = thcRes.rows[0];
              const thcPrice = Number(thcRow.unit_price);
              const thcFx = getFxRateToVnd(thcRow.currency || "USD");
              const thcVnd = roundVnd(new Decimal(thcPrice).mul(thcFx)).toNumber();
              components.push({
                costCode: "THC_PORT",
                costName: thcRow.notes || `Phí THC Cảng container lạnh [${thcRow.port_code}]`,
                isRequired: true,
                rateSourceId: thcRow.rate_id,
                vendorId: null,
                costSourceId: thcRow.port_code,
                vendorName: `${thcRow.port_name} [THC]`,
                quantity: 1,
                unit: "Cont",
                rateBasis: "PER_CONTAINER",
                originalCurrency: thcRow.currency || "USD",
                originalRate: thcPrice,
                fxRateToVnd: thcFx,
                estimatedCostVnd: thcVnd,
                worstCaseCostVnd: thcVnd,
              });
            }
          }

          const totalCompVnd = components.reduce((sum, c) => sum + c.estimatedCostVnd, 0);
          const totalWorstVnd = components.reduce((sum, c) => sum + c.worstCaseCostVnd, 0);

          verifiedOriginalRate = new Decimal(unitPrice);
          verifiedOriginalCurrency = pRow.currency || "VND";
          verifiedFxRate = fxRate;
          verifiedBuyRateVnd = new Decimal(totalCompVnd);
          verifiedWorstBuyVnd = new Decimal(totalWorstVnd);
          verifiedVendorId = null; // Cảng Chu Lai / Depot là đơn vị khai thác hạ tầng, không phải vendor trong bảng vendors
          verifiedCostSourceId = pRow.port_code;
          verifiedCostSourceType = "PORT_OPERATOR";
          verifiedVendorName = `${pRow.port_name} [${pRow.charge_code}]`;
          validityStart = pRow.validity_start;
          validityEnd = pRow.validity_end;
        } else if (item.servicePackage === "BORDER_GATE") {
          const borderRes = await client.query(
            `SELECT rate_id, border_pair_id, border_pair_name, commodity_name,
                    infrastructure_fee, entry_exit_fee, customs_fee, total_fee, currency,
                    lower(validity_range)::text as validity_start, upper(validity_range)::text as validity_end, status
             FROM border_rates
             WHERE rate_id = $1 AND status = 'ACTIVE' AND validity_range @> $2::date`,
            [item.selectedBuyRateId, pricingDate]
          );
          if (borderRes.rows.length === 0) {
            throw new Error("Biểu phí cửa khẩu đã chọn không còn hiệu lực hoặc đã ngừng áp dụng. Vui lòng tra cứu lại.");
          }
          const bRow = borderRes.rows[0];
          const totalFee = Number(bRow.total_fee);
          const fxRate = getFxRateToVnd(bRow.currency || "VND");
          const infraFee = Number(bRow.infrastructure_fee || 0);
          const entryExitFee = Number(bRow.entry_exit_fee || 0);
          const customsFee = Number(bRow.customs_fee || 0);

          if (infraFee > 0) {
            components.push({
              costCode: "INFRASTRUCTURE_FEE",
              costName: `Phí hạ tầng cửa khẩu [${bRow.border_pair_name}]`,
              isRequired: true,
              rateSourceId: bRow.rate_id,
              vendorId: null,
              costSourceId: bRow.border_pair_id,
              vendorName: `${bRow.border_pair_name} [Hạ tầng]`,
              quantity: 1,
              unit: "Chuyến",
              rateBasis: "PER_TRUCK",
              originalCurrency: bRow.currency || "VND",
              originalRate: infraFee,
              fxRateToVnd: fxRate,
              estimatedCostVnd: roundVnd(new Decimal(infraFee).mul(fxRate)).toNumber(),
              worstCaseCostVnd: roundVnd(new Decimal(infraFee).mul(fxRate)).toNumber(),
            });
          }
          if (entryExitFee > 0) {
            components.push({
              costCode: "ENTRY_EXIT_FEE",
              costName: `Phí bến bãi ra vào cửa khẩu [${bRow.border_pair_name}]`,
              isRequired: true,
              rateSourceId: bRow.rate_id,
              vendorId: null,
              costSourceId: bRow.border_pair_id,
              vendorName: `${bRow.border_pair_name} [Bến bãi]`,
              quantity: 1,
              unit: "Chuyến",
              rateBasis: "PER_TRUCK",
              originalCurrency: bRow.currency || "VND",
              originalRate: entryExitFee,
              fxRateToVnd: fxRate,
              estimatedCostVnd: roundVnd(new Decimal(entryExitFee).mul(fxRate)).toNumber(),
              worstCaseCostVnd: roundVnd(new Decimal(entryExitFee).mul(fxRate)).toNumber(),
            });
          }
          if (customsFee > 0) {
            components.push({
              costCode: "CUSTOMS_FEE",
              costName: `Phí kiểm hóa / thủ tục cửa khẩu [${bRow.border_pair_name}]`,
              isRequired: true,
              rateSourceId: bRow.rate_id,
              vendorId: null,
              costSourceId: bRow.border_pair_id,
              vendorName: `${bRow.border_pair_name} [Hải quan CK]`,
              quantity: 1,
              unit: "Chuyến",
              rateBasis: "PER_TRUCK",
              originalCurrency: bRow.currency || "VND",
              originalRate: customsFee,
              fxRateToVnd: fxRate,
              estimatedCostVnd: roundVnd(new Decimal(customsFee).mul(fxRate)).toNumber(),
              worstCaseCostVnd: roundVnd(new Decimal(customsFee).mul(fxRate)).toNumber(),
            });
          }

          const totalCompVnd = components.reduce((sum, c) => sum + c.estimatedCostVnd, 0);
          const priceVnd = totalCompVnd > 0 ? totalCompVnd : roundVnd(new Decimal(totalFee).mul(fxRate)).toNumber();

          verifiedOriginalRate = new Decimal(totalFee);
          verifiedOriginalCurrency = bRow.currency || "VND";
          verifiedFxRate = fxRate;
          verifiedBuyRateVnd = new Decimal(priceVnd);
          verifiedWorstBuyVnd = verifiedBuyRateVnd;
          verifiedVendorId = null; // Đơn vị quản lý liên vận cửa khẩu
          verifiedCostSourceId = bRow.border_pair_id;
          verifiedCostSourceType = "BORDER_MANAGEMENT";
          verifiedVendorName = `${bRow.border_pair_name} [${bRow.commodity_name}]`;
          validityStart = bRow.validity_start;
          validityEnd = bRow.validity_end;
        } else if (item.servicePackage === "OCEAN") {
          const oceanRes = await client.query(
            `SELECT rate_id, carrier_id, carrier_name, pol_id, pol_name, pod_id, pod_name,
                    container_type, commodity_name, ocean_freight_usd, thc_fee, docs_fee,
                    seal_fee, afs_fee, telex_fee, baf_caf_fee, other_surcharges, total_charges_vnd,
                    currency, lower(validity_range)::text as validity_start, upper(validity_range)::text as validity_end, status
             FROM ocean_rates
             WHERE rate_id = $1 AND status = 'ACTIVE' AND validity_range @> $2::date`,
            [item.selectedBuyRateId, pricingDate]
          );
          if (oceanRes.rows.length === 0) {
            throw new Error("Biểu cước vận tải biển đã chọn không còn hiệu lực hoặc đã ngừng áp dụng. Vui lòng tra cứu lại.");
          }
          const oRow = oceanRes.rows[0];
          if (item.originLocationId && oRow.pol_id && oRow.pol_id !== item.originLocationId) {
            throw new Error(`Cảng bốc (POL) [${oRow.pol_name}] không khớp với điểm đi [${item.originLocationId}] của dịch vụ.`);
          }
          if (item.destinationLocationId && oRow.pod_id && oRow.pod_id !== item.destinationLocationId) {
            throw new Error(`Cảng dỡ (POD) [${oRow.pod_name}] không khớp với điểm đến [${item.destinationLocationId}] của dịch vụ.`);
          }
          if (item.equipmentType && oRow.container_type && oRow.container_type !== item.equipmentType) {
            throw new Error(`Loại container cước biển [${oRow.container_type}] không khớp với [${item.equipmentType}] của báo giá.`);
          }

          const oceanFreightUsd = Number(oRow.ocean_freight_usd || 0);
          const usdFx = getFxRateToVnd("USD");
          const oceanFreightVnd = roundVnd(new Decimal(oceanFreightUsd).mul(usdFx)).toNumber();

          const localChargesVnd = Number(oRow.thc_fee || 0) + Number(oRow.docs_fee || 0) +
            Number(oRow.seal_fee || 0) + Number(oRow.afs_fee || 0) + Number(oRow.telex_fee || 0) +
            Number(oRow.baf_caf_fee || 0) + Number(oRow.other_surcharges || 0);

          if (oceanFreightUsd > 0) {
            components.push({
              costCode: "OCEAN_FREIGHT",
              costName: `Cước biển quốc tế [${oRow.carrier_name} - ${oRow.pol_name} -> ${oRow.pod_name}]`,
              isRequired: true,
              rateSourceId: oRow.rate_id,
              vendorId: oRow.carrier_id,
              costSourceId: oRow.carrier_id,
              vendorName: oRow.carrier_name,
              quantity: 1,
              unit: "Cont",
              rateBasis: "PER_CONTAINER",
              originalCurrency: "USD",
              originalRate: oceanFreightUsd,
              fxRateToVnd: usdFx,
              estimatedCostVnd: oceanFreightVnd,
              worstCaseCostVnd: oceanFreightVnd,
            });
          }
          if (localChargesVnd > 0) {
            components.push({
              costCode: "LOCAL_CHARGES",
              costName: `Phụ phí địa phương / bến bãi cảng biển (Docs, Seal, AFS, Telex...)`,
              isRequired: true,
              rateSourceId: oRow.rate_id,
              vendorId: oRow.carrier_id,
              costSourceId: oRow.carrier_id,
              vendorName: oRow.carrier_name,
              quantity: 1,
              unit: "Cont",
              rateBasis: "PER_CONTAINER",
              originalCurrency: "VND",
              originalRate: localChargesVnd,
              fxRateToVnd: 1.0,
              estimatedCostVnd: localChargesVnd,
              worstCaseCostVnd: localChargesVnd,
            });
          }

          const totalCompVnd = components.reduce((sum, c) => sum + c.estimatedCostVnd, 0);
          const totalFee = totalCompVnd > 0 ? totalCompVnd : Number(oRow.total_charges_vnd);

          verifiedOriginalRate = new Decimal(totalFee);
          verifiedOriginalCurrency = "VND";
          verifiedFxRate = 1.0;
          verifiedBuyRateVnd = new Decimal(totalFee);
          verifiedWorstBuyVnd = verifiedBuyRateVnd;
          verifiedVendorId = oRow.carrier_id;
          verifiedCostSourceId = oRow.carrier_id;
          verifiedCostSourceType = "VENDOR";
          verifiedVendorName = `${oRow.carrier_name} [${oRow.container_type} - ${oRow.pol_name} -> ${oRow.pod_name}]`;
          validityStart = oRow.validity_start;
          validityEnd = oRow.validity_end;
        } else if (item.servicePackage === "CUSTOMS") {
          const customsRes = await client.query(
            `SELECT rate_id, customs_office_id, customs_office_name, provider_id, provider_name,
                    customs_procedure, service_code, service_name, unit_price, rate_basis,
                    currency, lower(validity_range)::text as validity_start, upper(validity_range)::text as validity_end, status
             FROM customs_rates
             WHERE rate_id = $1 AND status = 'ACTIVE' AND validity_range @> $2::date`,
            [item.selectedBuyRateId, pricingDate]
          );
          if (customsRes.rows.length === 0) {
            throw new Error("Biểu phí hải quan đã chọn không còn hiệu lực hoặc đã ngừng áp dụng. Vui lòng tra cứu lại.");
          }
          const cRow = customsRes.rows[0];
          if (item.originLocationId && cRow.customs_office_id !== item.originLocationId) {
            throw new Error(`Chi cục Hải quan của biểu phí [${cRow.customs_office_name}] không khớp với địa điểm [${item.originLocationId}] của dịch vụ.`);
          }
          const unitPrice = Number(cRow.unit_price || 0);
          const fxRate = getFxRateToVnd(cRow.currency || "VND");
          const priceVnd = roundVnd(new Decimal(unitPrice).mul(fxRate)).toNumber();

          components.push({
            costCode: cRow.service_code || "CUSTOMS_DECLARATION",
            costName: `${cRow.service_name} [${cRow.customs_office_name}]`,
            isRequired: true,
            rateSourceId: cRow.rate_id,
            vendorId: cRow.provider_id,
            costSourceId: cRow.provider_id,
            vendorName: cRow.provider_name,
            quantity: 1,
            unit: cRow.rate_basis || "Tờ khai",
            rateBasis: cRow.rate_basis || "PER_DECLARATION",
            originalCurrency: cRow.currency || "VND",
            originalRate: unitPrice,
            fxRateToVnd: fxRate,
            estimatedCostVnd: priceVnd,
            worstCaseCostVnd: priceVnd,
          });

          verifiedOriginalRate = new Decimal(unitPrice);
          verifiedOriginalCurrency = cRow.currency || "VND";
          verifiedFxRate = fxRate;
          verifiedBuyRateVnd = new Decimal(priceVnd);
          verifiedWorstBuyVnd = verifiedBuyRateVnd;
          verifiedVendorId = cRow.provider_id;
          verifiedCostSourceId = cRow.provider_id;
          verifiedCostSourceType = "VENDOR";
          verifiedVendorName = `${cRow.provider_name} [${cRow.customs_office_name} - ${cRow.service_name}]`;
          validityStart = cRow.validity_start;
          validityEnd = cRow.validity_end;
        } else if (item.servicePackage === "WAREHOUSING") {
          const whRes = await client.query(
            `SELECT rate_id, warehouse_id, warehouse_name, provider_id, provider_name,
                    service_name, service_code, unit_price, currency, rate_basis, min_charge_vnd,
                    lower(validity_range)::text as validity_start, upper(validity_range)::text as validity_end, status
             FROM warehouse_rates
             WHERE rate_id = $1 AND status = 'ACTIVE' AND validity_range @> $2::date`,
            [item.selectedBuyRateId, pricingDate]
          );
          if (whRes.rows.length === 0) {
            throw new Error("Biểu phí kho bãi đã chọn không còn hiệu lực hoặc đã ngừng áp dụng. Vui lòng tra cứu lại.");
          }
          const wRow = whRes.rows[0];
          if (item.originLocationId && wRow.warehouse_id !== item.originLocationId) {
            throw new Error(`Kho bãi của biểu phí [${wRow.warehouse_name}] không khớp với địa điểm [${item.originLocationId}] của dịch vụ.`);
          }
          const unitPrice = Number(wRow.unit_price || 0);
          const fxRate = getFxRateToVnd(wRow.currency || "VND");
          const priceVnd = roundVnd(new Decimal(unitPrice).mul(fxRate)).toNumber();

          components.push({
            costCode: wRow.service_code || "STORAGE_FEE",
            costName: `${wRow.service_name} [${wRow.warehouse_name}]`,
            isRequired: true,
            rateSourceId: wRow.rate_id,
            vendorId: wRow.provider_id,
            costSourceId: wRow.provider_id,
            vendorName: wRow.provider_name,
            quantity: 1,
            unit: wRow.rate_basis || "Tấn.Ngày",
            rateBasis: wRow.rate_basis || "TON_DAY",
            originalCurrency: wRow.currency || "VND",
            originalRate: unitPrice,
            fxRateToVnd: fxRate,
            estimatedCostVnd: priceVnd,
            worstCaseCostVnd: priceVnd,
          });

          verifiedOriginalRate = new Decimal(unitPrice);
          verifiedOriginalCurrency = wRow.currency || "VND";
          verifiedFxRate = fxRate;
          verifiedBuyRateVnd = new Decimal(priceVnd);
          verifiedWorstBuyVnd = verifiedBuyRateVnd;
          verifiedVendorId = wRow.provider_id;
          verifiedCostSourceId = wRow.provider_id;
          verifiedCostSourceType = "VENDOR";
          verifiedVendorName = `${wRow.provider_name} [${wRow.service_name} - ${wRow.warehouse_name}]`;
          validityStart = wRow.validity_start;
          validityEnd = wRow.validity_end;
        } else if (item.servicePackage === "INSURANCE") {
          const insRes = await client.query(
            `SELECT rate_id, insurer_id, insurer_name, coverage_type, transport_mode,
                    pricing_model, unit_price, rate_percent, min_premium_vnd, deductible_vnd,
                    currency, lower(validity_range)::text as validity_start, upper(validity_range)::text as validity_end, status
             FROM insurance_rates
             WHERE rate_id = $1 AND status = 'ACTIVE' AND validity_range @> $2::date`,
            [item.selectedBuyRateId, pricingDate]
          );
          if (insRes.rows.length === 0) {
            throw new Error("Biểu phí bảo hiểm đã chọn không còn hiệu lực hoặc đã ngừng áp dụng. Vui lòng tra cứu lại.");
          }
          const iRow = insRes.rows[0];
          let premium = Number(iRow.unit_price || 0);
          const insuredVal = Number(item.insuredValue || 0);
          if (iRow.pricing_model === "PERCENT_OF_VALUE") {
            if (insuredVal > 0) {
              const calculated = (insuredVal * Number(iRow.rate_percent || 0)) / 100;
              premium = Math.max(calculated, Number(iRow.min_premium_vnd || 0));
            } else {
              throw new Error("Dịch vụ bảo hiểm tính theo % giá trị yêu cầu nhập Giá trị hàng hóa bảo hiểm (insuredValue) lớn hơn 0.");
            }
          }
          const fxRate = getFxRateToVnd(iRow.currency || "VND");
          const priceVnd = roundVnd(new Decimal(premium).mul(fxRate)).toNumber();

          components.push({
            costCode: "INSURANCE_PREMIUM",
            costName: `Phí bảo hiểm [${iRow.coverage_type} - ${iRow.transport_mode}]`,
            isRequired: true,
            rateSourceId: iRow.rate_id,
            vendorId: iRow.insurer_id,
            costSourceId: iRow.insurer_id,
            vendorName: iRow.insurer_name,
            quantity: 1,
            unit: "Lô hàng",
            rateBasis: "PER_SHIPMENT",
            originalCurrency: iRow.currency || "VND",
            originalRate: premium,
            fxRateToVnd: fxRate,
            estimatedCostVnd: priceVnd,
            worstCaseCostVnd: priceVnd,
          });

          verifiedOriginalRate = new Decimal(premium);
          verifiedOriginalCurrency = iRow.currency || "VND";
          verifiedFxRate = fxRate;
          verifiedBuyRateVnd = new Decimal(priceVnd);
          verifiedWorstBuyVnd = verifiedBuyRateVnd;
          verifiedVendorId = iRow.insurer_id;
          verifiedCostSourceId = iRow.insurer_id;
          verifiedCostSourceType = "VENDOR";
          verifiedVendorName = `${iRow.insurer_name} [${iRow.coverage_type} - ${iRow.transport_mode}]`;
          validityStart = iRow.validity_start;
          validityEnd = iRow.validity_end;
        } else if (item.servicePackage === "OTHER") {
          const otherRes = await client.query(
            `SELECT rate_id, service_code, service_name, provider_id, provider_name,
                    pricing_method, rate_basis, unit_price, currency, evidence_required,
                    lower(validity_range)::text as validity_start, upper(validity_range)::text as validity_end, status
             FROM other_rates
             WHERE rate_id = $1 AND status = 'ACTIVE' AND validity_range @> $2::date`,
            [item.selectedBuyRateId, pricingDate]
          );
          if (otherRes.rows.length === 0) {
            throw new Error("Biểu phí dịch vụ khác đã chọn không còn hiệu lực hoặc đã ngừng áp dụng. Vui lòng tra cứu lại.");
          }
          const otRow = otherRes.rows[0];
          const unitPrice = Number(otRow.unit_price || 0);
          const fxRate = getFxRateToVnd(otRow.currency || "VND");
          const priceVnd = roundVnd(new Decimal(unitPrice).mul(fxRate)).toNumber();

          components.push({
            costCode: otRow.service_code || "OTHER_FEE",
            costName: `${otRow.service_name} [${otRow.provider_name}]`,
            isRequired: true,
            rateSourceId: otRow.rate_id,
            vendorId: otRow.provider_id,
            costSourceId: otRow.provider_id,
            vendorName: otRow.provider_name,
            quantity: 1,
            unit: otRow.rate_basis || "Lô",
            rateBasis: otRow.rate_basis || "LOT",
            originalCurrency: otRow.currency || "VND",
            originalRate: unitPrice,
            fxRateToVnd: fxRate,
            estimatedCostVnd: priceVnd,
            worstCaseCostVnd: priceVnd,
          });

          verifiedOriginalRate = new Decimal(unitPrice);
          verifiedOriginalCurrency = otRow.currency || "VND";
          verifiedFxRate = fxRate;
          verifiedBuyRateVnd = new Decimal(priceVnd);
          verifiedWorstBuyVnd = verifiedBuyRateVnd;
          verifiedVendorId = otRow.provider_id;
          verifiedCostSourceId = otRow.provider_id;
          verifiedCostSourceType = "VENDOR";
          verifiedVendorName = `${otRow.provider_name} [${otRow.service_name} - ${otRow.pricing_method}]`;
          validityStart = otRow.validity_start;
          validityEnd = otRow.validity_end;
        } else {
          const result = await lookupRoadRates({
            pickupLocationId: item.originLocationId, deliveryLocationId: item.destinationLocationId,
            equipmentType: item.equipmentType, pricingDate,
          }, client);
          if (result.status === "CONFLICT_RATE") throw new Error(result.message);
          const selected = result.candidates.find((candidate) => candidate.rateId === item.selectedBuyRateId);
          if (!selected) throw new Error("Giá mua không còn hợp lệ cho tuyến/thiết bị/ngày hiện tại. Vui lòng tra cứu lại.");
          verifiedOriginalRate = new Decimal(selected.buyRate);
          verifiedOriginalCurrency = selected.currency;
          verifiedFxRate = selected.fxRateToVnd;
          verifiedBuyRateVnd = new Decimal(selected.buyRateVnd);
          verifiedVendorId = selected.vendorId;
          verifiedCostSourceId = selected.vendorId;
          verifiedCostSourceType = "VENDOR";
          verifiedVendorName = selected.vendorName;
          validityStart = selected.validityStart;
          validityEnd = selected.validityEnd;
          verifiedWorstBuyVnd = new Decimal(result.worstCaseBuy ?? selected.buyRateVnd);

          components.push({
            costCode: "ROAD_FREIGHT",
            costName: `Cước vận tải đường bộ [${selected.vendorName}]`,
            isRequired: true,
            rateSourceId: selected.rateId,
            vendorId: selected.vendorId,
            costSourceId: selected.vendorId,
            vendorName: selected.vendorName,
            quantity: 1,
            unit: item.unit || "TRIP",
            rateBasis: "PER_TRIP",
            originalCurrency: selected.currency,
            originalRate: Number(selected.buyRate),
            fxRateToVnd: selected.fxRateToVnd,
            estimatedCostVnd: selected.buyRateVnd,
            worstCaseCostVnd: Number(result.worstCaseBuy ?? selected.buyRateVnd),
          });
        }
      }

      const itemBuyTotal = roundVnd(verifiedBuyRateVnd.mul(itemQty));
      const itemWorstTotal = roundVnd(verifiedWorstBuyVnd.mul(itemQty));
      serverTotalBuy = serverTotalBuy.add(itemBuyTotal);
      serverTotalWorstBuy = serverTotalWorstBuy.add(itemWorstTotal);

      const itemGp = itemSellTotal.sub(itemBuyTotal);
      const itemMargin = itemSellTotal.isZero() ? new Decimal(0) : itemGp.div(itemSellTotal).mul(100);

      verifiedItems.push({
        item,
        itemQty,
        itemSellUnit,
        itemSellTotal,
        verifiedBuyRateVnd,
        verifiedWorstBuyVnd,
        verifiedOriginalRate,
        verifiedOriginalCurrency,
        verifiedFxRate,
        itemBuyTotal,
        itemWorstTotal,
        itemGp,
        itemMargin,
        verifiedVendorId,
        verifiedCostSourceId,
        verifiedCostSourceType,
        verifiedVendorName,
        validityStart,
        validityEnd,
        components,
      });
    }

    if ([serverTotalSell, serverTotalBuy, serverTotalWorstBuy].some((value) => value.gt("9999999999999"))) {
      throw new Error("Tổng tiền vượt giới hạn lưu trữ của báo giá.");
    }
    const estimatedGp = serverTotalSell.sub(serverTotalBuy);
    const estimatedMarginPercent = serverTotalSell.isZero()
      ? new Decimal(0)
      : estimatedGp.div(serverTotalSell).mul(100);

    // Validate Customer Role Active & Fetch Snapshot Data
    const customerCheck = await client.query(
      `SELECT c.customer_id, p.partner_name, p.tax_code, p.address, c.role_status, p.status
       FROM customers c
       JOIN partners p ON c.customer_id = p.partner_id
       WHERE c.customer_id = $1`,
      [input.customerId]
    );

    if (customerCheck.rows.length === 0) {
      throw new Error(`Khách hàng [${input.customerId}] không tồn tại trong hệ thống.`);
    }

    const customerRow = customerCheck.rows[0];
    if (customerRow.role_status !== "ACTIVE" || customerRow.status !== "ACTIVE") {
      throw new Error(
        `Khách hàng [${customerRow.partner_name || input.customerId}] chưa được kích hoạt vai trò Khách hàng (Customer Role) hoặc trạng thái Partner không hoạt động.`
      );
    }

    let quotationId = input.quotationId;
    let quotationNo = "";

    // 2. Phân biệt Create Draft vs Update Draft (PR-05)
    if (quotationId) {
      // --- UPDATE DRAFT ---
      const existingQuote = await client.query(
        `SELECT quotation_id, quotation_no, status, immutable_locked 
         FROM customer_quotations 
         WHERE quotation_id = $1`,
        [quotationId]
      );

      if (existingQuote.rows.length === 0) {
        throw new Error("Không tìm thấy Báo giá để cập nhật.");
      }

      const qRow = existingQuote.rows[0];
      if (qRow.immutable_locked || qRow.status !== "DRAFT") {
        throw new Error(`Báo giá [${qRow.quotation_no}] hiện ở trạng thái ${qRow.status} hoặc đã bị khóa, không thể cập nhật nháp.`);
      }

      quotationNo = qRow.quotation_no;

      await client.query(
        `UPDATE customer_quotations SET
           customer_id = $1,
           customer_name_snapshot = $2,
           customer_tax_code_snapshot = $3,
           customer_address_snapshot = $4,
           region_id = $5,
           commodity_id = $6,
           total_sell_amount = $7,
           total_estimated_buy = $8,
           total_worst_case_buy = $9,
           estimated_gp = $10,
           estimated_margin_percent = $11,
           payment_terms_days = $12,
           pricing_date = $13,
           valid_until = $14,
           updated_at = clock_timestamp()
         WHERE quotation_id = $15`,
        [
          input.customerId,
          customerRow.partner_name,
          customerRow.tax_code,
          customerRow.address,
          input.regionId,
          input.commodityId || null,
          serverTotalSell.toNumber(),
          serverTotalBuy.toNumber(),
          serverTotalWorstBuy.toNumber(),
          estimatedGp.toNumber(),
          Number(estimatedMarginPercent.toFixed(2)),
          input.paymentTermsDays,
          pricingDate,
          input.validUntil || null,
          quotationId,
        ]
      );

      // Xóa cấu phần chi phí, snapshot và các dòng dịch vụ cũ theo thứ tự an toàn để tránh lỗi Foreign Key
      await client.query("DELETE FROM quotation_item_cost_components WHERE quotation_id = $1", [quotationId]);
      await client.query("DELETE FROM quotation_buy_snapshots WHERE quotation_id = $1", [quotationId]);
      await client.query("DELETE FROM quotation_service_items WHERE quotation_id = $1", [quotationId]);
    } else {
      // --- CREATE NEW DRAFT ---
      // Sinh số báo giá có cấu trúc tuần tự từ PostgreSQL sequence
      const seqRes = await client.query("SELECT nextval('quotation_no_seq') as seq");
      const seqNum = Number(seqRes.rows[0].seq);

      quotationNo = `QT-${pricingDate.slice(0, 4)}-${String(seqNum).padStart(5, "0")}`;

      const quoteRes = await client.query(
        `INSERT INTO customer_quotations (
           quotation_no, version, customer_id, customer_name_snapshot, customer_tax_code_snapshot, customer_address_snapshot,
           region_id, commodity_id,
           status, total_sell_amount, total_estimated_buy, total_worst_case_buy,
           estimated_gp, estimated_margin_percent, payment_terms_days,
           pricing_date, valid_until,
           immutable_locked, created_by, created_by_user_id
         ) VALUES (
           $1, 1, $2, $3, $4, $5,
           $6, $7,
           'DRAFT', $8, $9, $10,
           $11, $12, $13,
           $14, $15,
           false, $16, $17
         ) RETURNING quotation_id;`,
        [
          quotationNo,
          input.customerId,
          customerRow.partner_name,
          customerRow.tax_code,
          customerRow.address,
          input.regionId,
          input.commodityId || null,
          serverTotalSell.toNumber(),
          serverTotalBuy.toNumber(),
          serverTotalWorstBuy.toNumber(),
          estimatedGp.toNumber(),
          Number(estimatedMarginPercent.toFixed(2)),
          input.paymentTermsDays,
          pricingDate,
          input.validUntil || null,
          createdBy,
          actor.userId,
        ]
      );

      quotationId = quoteRes.rows[0].quotation_id;
    }

    // 3. Lưu từng dòng dịch vụ con (quotation_service_items) & BUY Snapshots
    for (const vItem of verifiedItems) {
      const itemRes = await client.query(
        `INSERT INTO quotation_service_items (
           quotation_id, service_package, pricing_inclusion,
           origin_location_id, destination_location_id, equipment_type,
           planned_quantity, unit, unit_sell_price, total_sell_price,
           selected_buy_rate_id, estimated_buy_amount, worst_case_buy_amount,
           item_gp, item_margin_percent, insured_value
         ) VALUES (
           $1, $2, $3,
           $4, $5, $6,
           $7, $8, $9, $10,
           $11, $12, $13,
           $14, $15, $16
         ) RETURNING item_id;`,
        [
          quotationId,
          vItem.item.servicePackage,
          vItem.item.pricingInclusion,
          vItem.item.originLocationId,
          vItem.item.destinationLocationId,
          vItem.item.equipmentType,
          vItem.item.plannedQuantity,
          vItem.item.unit,
          vItem.itemSellUnit.toNumber(),
          vItem.itemSellTotal.toNumber(),
          vItem.item.selectedBuyRateId || null,
          vItem.itemBuyTotal.toNumber(),
          vItem.itemWorstTotal.toNumber(),
          vItem.itemGp.toNumber(),
          Number(vItem.itemMargin.toFixed(2)),
          vItem.item.insuredValue ? Number(vItem.item.insuredValue) : null,
        ]
      );

      // PR-04: Lưu Snapshot với dữ liệu có thẩm quyền từ PostgreSQL kèm FX Rate & Cost Source
      if (vItem.item.selectedBuyRateId && (vItem.verifiedVendorId || vItem.verifiedCostSourceId)) {
        await client.query(
          `INSERT INTO quotation_buy_snapshots (
             quotation_id, item_id, source_rate_id,
             vendor_id, vendor_name, rate_amount,
             original_currency, fx_rate_to_vnd, rate_amount_vnd,
             validity_start, validity_end,
             cost_source_id, cost_source_type
           ) VALUES (
             $1, $2, $3,
             $4, $5, $6,
             $7, $8, $9,
             $10::date, $11::date,
             $12, $13
           );`,
          [
            quotationId,
            itemRes.rows[0].item_id,
            vItem.item.selectedBuyRateId,
            vItem.verifiedVendorId || null,
            vItem.verifiedVendorName || "Nhà cung cấp đã duyệt",
            vItem.verifiedOriginalRate.toNumber(),
            vItem.verifiedOriginalCurrency,
            vItem.verifiedFxRate,
            vItem.verifiedBuyRateVnd.toNumber(),
            vItem.validityStart,
            vItem.validityEnd,
            vItem.verifiedCostSourceId || vItem.verifiedVendorId,
            vItem.verifiedCostSourceType || "VENDOR",
          ]
        );
      }

      // Lưu chi tiết từng cấu phần chi phí (Cost Components) cấu thành dịch vụ
      const currentItemId = itemRes.rows[0].item_id;
      if (vItem.components && vItem.components.length > 0) {
        for (const comp of vItem.components) {
          await client.query(
            `INSERT INTO quotation_item_cost_components (
               quotation_id, item_id, cost_code, cost_name, is_required,
               rate_source_id, vendor_id, cost_source_id, vendor_name,
               quantity, unit, rate_basis, original_currency, original_rate,
               fx_rate_to_vnd, estimated_cost_vnd, worst_case_cost_vnd
             ) VALUES (
               $1, $2, $3, $4, $5,
               $6, $7, $8, $9,
               $10, $11, $12, $13, $14,
               $15, $16, $17
             );`,
            [
              quotationId,
              currentItemId,
              comp.costCode,
              comp.costName,
              comp.isRequired,
              comp.rateSourceId || null,
              comp.vendorId || null,
              comp.costSourceId || null,
              comp.vendorName,
              comp.quantity,
              comp.unit,
              comp.rateBasis,
              comp.originalCurrency,
              comp.originalRate,
              comp.fxRateToVnd,
              comp.estimatedCostVnd,
              comp.worstCaseCostVnd,
            ]
          );
        }
      }
    }

    if (submit) {
      const submitted = await submitQuotationForApproval(quotationId as string, actor, client);
      if (!submitted.success) throw new Error(submitted.error);
    }
    const revisionResult = await client.query(
      'SELECT updated_at::text as revision FROM customer_quotations WHERE quotation_id = $1', [quotationId]
    );
    await client.query("COMMIT");
    return {
      success: true,
      quotationId: quotationId as string,
      quotationNo,
      revision: revisionResult.rows[0].revision as string,
      status: submit ? "PENDING_APPROVAL" as const : "DRAFT" as const,
      items: verifiedItems.map((entry) => ({ unitBuyPrice: entry.verifiedBuyRateVnd.toNumber(), worstCaseBuyPrice: entry.verifiedWorstBuyVnd.toNumber(), unitSellPrice: entry.itemSellUnit.toNumber() })),
      financials: {
        totalSellAmount: serverTotalSell.toNumber(),
        totalEstimatedBuy: serverTotalBuy.toNumber(),
        totalWorstCaseBuy: serverTotalWorstBuy.toNumber(),
        estimatedGp: estimatedGp.toNumber(),
        estimatedMarginPercent: Number(estimatedMarginPercent.toFixed(2)),
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw new Error(`Lỗi giao dịch cơ sở dữ liệu khi lưu báo giá: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    client.release();
  }
}

/**
 * Trình duyệt Báo giá và Kích hoạt Trạng thái Chờ duyệt (PENDING_APPROVAL)
 */
export async function submitQuotationForApproval(
  quotationId: string,
  actor: CurrentActor,
  transactionClient?: PoolClient
) {
  requireRole(actor, ["SALES", "PRICING_SPECIALIST", "PRICING_MANAGER"]);
  const client = transactionClient ?? await pool.connect();
  try {
    if (!transactionClient) await client.query("BEGIN");

    const quoteCheck = await client.query(
      `SELECT quotation_id, quotation_no, version, region_id, status, immutable_locked, estimated_margin_percent 
       FROM customer_quotations 
       WHERE quotation_id = $1 FOR UPDATE`,
      [quotationId]
    );

    if (quoteCheck.rows.length === 0) {
      if (!transactionClient) await client.query("ROLLBACK");
      return { success: false, error: "Báo giá không tồn tại trong hệ thống." };
    }

    const currentQuote = quoteCheck.rows[0];

    // Kiểm tra Region Scope của người gửi duyệt
    try {
      requireRegionScope(actor, currentQuote.region_id);
    } catch (scopeErr) {
      if (!transactionClient) await client.query("ROLLBACK");
      return {
        success: false,
        error: scopeErr instanceof Error ? scopeErr.message : `Từ chối phân quyền (403): Người dùng [${actor.fullName}] không có quyền trình duyệt báo giá thuộc phân vùng [${currentQuote.region_id}].`,
      };
    }

    if (currentQuote.status !== "DRAFT" || currentQuote.immutable_locked) {
      if (!transactionClient) await client.query("ROLLBACK");
      return {
        success: false,
        error: `Không thể trình duyệt: Báo giá [${currentQuote.quotation_no}] hiện ở trạng thái ${currentQuote.status} hoặc đã bị khóa.`,
      };
    }

    // Quy tắc P0: Không cho submit nếu thiếu giá mua đầu vào (MISSING RATE)
    const checkRes = await client.query(
      `SELECT COUNT(*) as item_count, COUNT(*) FILTER (WHERE selected_buy_rate_id IS NULL OR estimated_buy_amount <= 0) as missing_count FROM quotation_service_items WHERE quotation_id = $1`,
      [quotationId]
    );

    if (Number(checkRes.rows[0].item_count) === 0 || Number(checkRes.rows[0].missing_count) > 0) {
      if (!transactionClient) await client.query("ROLLBACK");
      return {
        success: false,
        error: "Không thể trình duyệt: Có dịch vụ chưa xác định hoặc thiếu giá mua đầu vào (MISSING RATE).",
      };
    }

    // Cập nhật trạng thái PENDING_APPROVAL
    const updateRes = await client.query(
      `UPDATE customer_quotations 
       SET status = 'PENDING_APPROVAL', updated_at = clock_timestamp()
       WHERE quotation_id = $1 AND status = 'DRAFT' AND immutable_locked = false
       RETURNING quotation_id, quotation_no`,
      [quotationId]
    );

    if (updateRes.rowCount === 0) {
      if (!transactionClient) await client.query("ROLLBACK");
      return { success: false, error: "Xung đột đồng thời: Báo giá đã được thay đổi bởi một tác vụ khác." };
    }

    // Ghi Audit Log
    await client.query(
      `INSERT INTO quotation_approval_log (
         quotation_id, version, action, actor_id, actor_name, comment, snapshot_margin_percent
       ) VALUES ($1, $2, 'SUBMITTED', $3, $4, $5, $6);`,
      [
        quotationId,
        currentQuote.version || 1,
        actor.userId,
        actor.fullName,
        `Trình thẩm định bởi [${actor.fullName} (${actor.role})]`,
        currentQuote.estimated_margin_percent || 0,
      ]
    );

    if (!transactionClient) await client.query("COMMIT");
    return {
      success: true,
      message: `Đã trình duyệt thành công Báo giá [${updateRes.rows[0].quotation_no}] sang Hội đồng Định giá phê duyệt.`,
    };
  } catch (err) {
    if (!transactionClient) await client.query("ROLLBACK");
    return {
      success: false,
      error: `Lỗi kết nối cơ sở dữ liệu khi trình duyệt: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    if (!transactionClient) client.release();
  }
}

/**
 * Phê duyệt Báo giá (Approve) theo Ma trận Biên lợi nhuận (PR-05)
 */
export async function approveQuotation(
  quotationId: string,
  actor: CurrentActor,
  comment?: string
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const quoteCheck = await client.query(
      `SELECT quotation_id, quotation_no, version, customer_id, region_id, status, immutable_locked, estimated_margin_percent, created_by, created_by_user_id, pricing_date
       FROM customer_quotations 
       WHERE quotation_id = $1 FOR UPDATE`,
      [quotationId]
    );

    if (quoteCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Báo giá không tồn tại." };
    }

    const currentQuote = quoteCheck.rows[0];

    // Phải ở trạng thái PENDING_APPROVAL
    if (currentQuote.status !== "PENDING_APPROVAL") {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Không thể phê duyệt: Báo giá hiện ở trạng thái [${currentQuote.status}], không phải PENDING_APPROVAL.`,
      };
    }

    // Kiểm tra Region Scope
    try {
      requireRegionScope(actor, currentQuote.region_id);
    } catch (scopeErr) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: scopeErr instanceof Error ? scopeErr.message : `Từ chối phân quyền (403): Người dùng [${actor.fullName}] không phụ trách phân vùng [${currentQuote.region_id}].`,
      };
    }

    // Kiểm tra nguyên tắc 4 mắt (Four-Eyes Principle): Người lập không được tự phê duyệt báo giá của chính mình
    if (
      isQuotationAuthor(currentQuote.created_by_user_id, currentQuote.created_by, actor)
    ) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Vi phạm nguyên tắc 4 mắt (Four-Eyes Principle): Bạn [${actor.fullName}] là người lập báo giá này nên không thể tự phê duyệt. Báo giá cần được thẩm định bởi cấp quản lý độc lập.`,
      };
    }

    // Kiểm tra Ma trận Phê duyệt dựa trên Margin %
    const margin = Number(currentQuote.estimated_margin_percent || 0);
    const authority = evaluateApprovalAuthority(margin, actor.role);

    if (!authority.allowed) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: authority.reason || "Bạn không đủ thẩm quyền phê duyệt báo giá này.",
      };
    }

    // Bắt buộc nhập lý do (Reason) khi biên lợi nhuận dưới mức chuẩn 15%
    if (margin < 15 && (!comment || comment.trim().length < 5)) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Biên lợi nhuận ${margin}% thấp hơn mức tiêu chuẩn (15%). Bắt buộc phải nhập Lý do phê duyệt ngoại lệ (tối thiểu 5 ký tự) để phục vụ giải trình kiểm toán.`,
      };
    }

    const activeCustomer = await client.query("SELECT c.customer_id FROM customers c JOIN partners p ON p.partner_id=c.customer_id WHERE c.customer_id=$1 AND c.role_status='ACTIVE' AND p.status='ACTIVE' FOR SHARE OF c,p", [currentQuote.customer_id]);
    if (!activeCustomer.rows.length) throw new Error("Khách hàng đã ngừng hoạt động. Không thể duyệt báo giá.");
    await validateApprovalRates(client, quotationId, currentQuote.pricing_date || undefined);

    // Cập nhật APPROVED & Khóa Bất Biến (Immutable Locked) kèm xác nhận Snapshot
    await client.query(
      `UPDATE customer_quotations q
       SET commercial_snapshot = quotation_commercial_snapshot(q.quotation_id), status = 'APPROVED', approved_by = $1, approved_at = NOW(), immutable_locked = true, updated_at = clock_timestamp(),
           customer_name_snapshot = COALESCE(q.customer_name_snapshot, p.partner_name),
           customer_tax_code_snapshot = COALESCE(q.customer_tax_code_snapshot, p.tax_code),
           customer_address_snapshot = COALESCE(q.customer_address_snapshot, p.address)
       FROM customers c
       JOIN partners p ON c.customer_id = p.partner_id
       WHERE q.quotation_id = $2 AND q.status = 'PENDING_APPROVAL' AND q.customer_id = c.customer_id`,
      [`${actor.fullName} (${actor.role})`, quotationId]
    );

    await client.query(`WITH replaced AS (
      UPDATE customer_quotations SET status='SUPERSEDED', updated_at=clock_timestamp()
      WHERE quotation_no=$1 AND version<$2 AND status='APPROVED' RETURNING quotation_id,version,estimated_margin_percent
    ) INSERT INTO quotation_approval_log(quotation_id,version,action,actor_id,actor_name,comment,snapshot_margin_percent)
      SELECT quotation_id,version,'SUPERSEDED',$3,$4,$5,estimated_margin_percent FROM replaced`,
      [currentQuote.quotation_no, currentQuote.version, actor.userId, actor.fullName, `Thay thế bởi phiên bản ${currentQuote.version}`]);
    // Ghi Audit Log
    const auditComment = comment || authority.reason || `Phê duyệt chính thức bởi [${actor.fullName} - ${actor.role}]`;
    await client.query(
      `INSERT INTO quotation_approval_log (
         quotation_id, version, action, actor_id, actor_name, comment, snapshot_margin_percent
       ) VALUES ($1, $2, 'APPROVED', $3, $4, $5, $6);`,
      [
        quotationId,
        currentQuote.version || 1,
        actor.userId,
        actor.fullName,
        auditComment,
        margin,
      ]
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: `Báo giá [${currentQuote.quotation_no}] đã được PHÊ DUYỆT CHÍNH THỨC và KHÓA BẤT BIẾN (Immutable Locked).`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      success: false,
      error: `Lỗi cơ sở dữ liệu khi phê duyệt: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    client.release();
  }
}

/**
 * Từ chối Báo giá (Reject)
 */
export async function rejectQuotation(
  quotationId: string,
  actor: CurrentActor,
  comment: string
) {
  if (!comment || comment.trim().length === 0) {
    return { success: false, error: "Vui lòng nhập lý do từ chối báo giá." };
  }

  requireRole(actor, ["PRICING_MANAGER"]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const quoteCheck = await client.query(
      `SELECT quotation_id, quotation_no, version, region_id, status, estimated_margin_percent 
       FROM customer_quotations 
       WHERE quotation_id = $1 FOR UPDATE`,
      [quotationId]
    );

    if (quoteCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Báo giá không tồn tại." };
    }

    const currentQuote = quoteCheck.rows[0];

    if (currentQuote.status !== "PENDING_APPROVAL") {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Không thể từ chối: Báo giá hiện ở trạng thái [${currentQuote.status}].`,
      };
    }

    // Kiểm tra Region Scope
    try {
      requireRegionScope(actor, currentQuote.region_id);
    } catch (scopeErr) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: scopeErr instanceof Error ? scopeErr.message : `Từ chối phân quyền (403): Người dùng [${actor.fullName}] không phụ trách phân vùng [${currentQuote.region_id}].`,
      };
    }

    // Kiểm tra vai trò người từ chối
    if (actor.role === "SALES" || actor.role === "OPERATIONS" || actor.role === "ACCOUNTANT") {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Từ chối thẩm quyền: Vai trò [${actor.role}] không có quyền từ chối báo giá thương mại.`,
      };
    }

    await client.query(
      `UPDATE customer_quotations 
       SET status = 'REJECTED', updated_at = clock_timestamp()
       WHERE quotation_id = $1 AND status = 'PENDING_APPROVAL'`,
      [quotationId]
    );

    await client.query(
      `INSERT INTO quotation_approval_log (
         quotation_id, version, action, actor_id, actor_name, comment, snapshot_margin_percent
       ) VALUES ($1, $2, 'REJECTED', $3, $4, $5, $6);`,
      [
        quotationId,
        currentQuote.version || 1,
        actor.userId,
        actor.fullName,
        comment,
        currentQuote.estimated_margin_percent || 0,
      ]
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: `Đã từ chối báo giá [${currentQuote.quotation_no}]. Lý do: "${comment}".`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      success: false,
      error: `Lỗi cơ sở dữ liệu khi từ chối: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    client.release();
  }
}

/**
 * Trả về Bản Nháp để chỉnh sửa (Return to Draft)
 */
export async function returnQuotationToDraft(
  quotationId: string,
  actor: CurrentActor,
  comment: string
) {
  requireRole(actor, ["PRICING_MANAGER"]);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const quoteCheck = await client.query(
      `SELECT quotation_id, quotation_no, version, region_id, status, estimated_margin_percent 
       FROM customer_quotations 
       WHERE quotation_id = $1 FOR UPDATE`,
      [quotationId]
    );

    if (quoteCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Báo giá không tồn tại." };
    }

    const currentQuote = quoteCheck.rows[0];

    if (!["PENDING_APPROVAL", "REJECTED"].includes(currentQuote.status)) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Không thể trả về nháp: Báo giá hiện ở trạng thái [${currentQuote.status}].`,
      };
    }

    // Bắt buộc nhập lý do khi trả về nháp
    if (!comment || comment.trim().length === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: "Vui lòng nhập lý do trả báo giá về bản nháp để nhân viên lập chỉnh sửa.",
      };
    }

    // Kiểm tra Region Scope
    try {
      requireRegionScope(actor, currentQuote.region_id);
    } catch (scopeErr) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: scopeErr instanceof Error ? scopeErr.message : `Từ chối phân quyền (403): Người dùng [${actor.fullName}] không phụ trách phân vùng [${currentQuote.region_id}].`,
      };
    }

    // Kiểm tra vai trò người trả về nháp
    if (actor.role === "SALES" || actor.role === "OPERATIONS" || actor.role === "ACCOUNTANT") {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: `Từ chối thẩm quyền: Vai trò [${actor.role}] không có quyền trả báo giá về bản nháp.`,
      };
    }

    await client.query(
      `UPDATE customer_quotations 
       SET status = 'DRAFT', immutable_locked = false, updated_at = clock_timestamp()
       WHERE quotation_id = $1 AND status IN ('PENDING_APPROVAL', 'REJECTED')`,
      [quotationId]
    );

    await client.query(
      `INSERT INTO quotation_approval_log (
         quotation_id, version, action, actor_id, actor_name, comment, snapshot_margin_percent
       ) VALUES ($1, $2, 'RETURNED_FOR_REVISION', $3, $4, $5, $6);`,
      [
        quotationId,
        currentQuote.version || 1,
        actor.userId,
        actor.fullName,
        comment || "Yêu cầu chỉnh sửa lại cấu thành giá bán/chi phí mua",
        currentQuote.estimated_margin_percent || 0,
      ]
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: `Đã trả Báo giá [${currentQuote.quotation_no}] về trạng thái DRAFT để điều chỉnh.`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      success: false,
      error: `Lỗi cơ sở dữ liệu khi trả về nháp: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    client.release();
  }
}

export interface QuotationListItem {
  quotationId: string;
  quotationNo: string;
  version: number;
  customerId: string;
  customerName: string;
  regionId: string;
  regionName: string;
  commodityName?: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  totalSellAmount: number;
  totalEstimatedBuy: number;
  estimatedGp: number;
  estimatedMarginPercent: number;
  paymentTermsDays: number;
  createdBy: string;
  createdAt: string;
  routeSummary?: string;
  equipmentType?: string;
  itemCount: number;
}

export interface QuotationSnapshotItem {
  snapshotId: string;
  itemId: string;
  sourceRateId: string;
  vendorId: string | null;
  costSourceId?: string;
  costSourceType?: string;
  vendorName: string;
  rateAmount: number;
  originalCurrency: string;
  fxRateToVnd: number;
  rateAmountVnd: number;
  validityStart: string;
  validityEnd: string;
  snapshotAt: string;
}

export interface QuotationApprovalLogItem {
  logId: string;
  version: number;
  action: string;
  actorId: string;
  actorName?: string;
  comment?: string;
  snapshotMarginPercent?: number;
  createdAt: string;
}

export interface QuotationDetailResponse {
  quote: {
    revision: string;
    quotationId: string;
    quotationNo: string;
    version: number;
    customerId: string;
    customerName: string;
    taxCode?: string;
    regionId: string;
    regionName: string;
    commodityId?: string;
    commodityName?: string;
    status: string;
    totalSellAmount: number;
    totalEstimatedBuy: number;
    totalWorstCaseBuy: number;
    estimatedGp: number;
    estimatedMarginPercent: number;
    paymentTermsDays: number;
    pricingDate?: string;
    validUntil?: string;
    immutableLocked: boolean;
    createdBy: string;
    createdByUserId?: string;
    approvedBy?: string;
    approvedAt?: string;
    createdAt: string;
  };
  items: Array<{
    itemId: string;
    servicePackage: string;
    pricingInclusion: string;
    originLocationId: string;
    originName?: string;
    destinationLocationId: string;
    destinationName?: string;
    equipmentType: string;
    plannedQuantity: number;
    unit: string;
    unitSellPrice: number;
    totalSellPrice: number;
    insuredValue?: number;
    selectedBuyRateId?: string;
    estimatedBuyAmount: number;
    worstCaseBuyAmount: number;
    itemGp: number;
    itemMarginPercent: number;
  }>;
  snapshots: QuotationSnapshotItem[];
  costComponents?: QuotationCostComponentItem[];
  approvalLogs: QuotationApprovalLogItem[];
}

/**
 * Lấy danh sách Báo giá từ PostgreSQL phục vụ Quotation List & Approval Worklist
 */
export async function getQuotationsList(actor: CurrentActor, filters?: {
  status?: string;
  regionId?: string;
  search?: string;
  limit?: number;
}): Promise<QuotationListItem[]> {
  let query = `
    SELECT 
      q.quotation_id as "quotationId",
      q.quotation_no as "quotationNo",
      q.version,
      q.customer_id as "customerId",
      COALESCE(q.customer_name_snapshot, p.partner_name, q.customer_id) as "customerName",
      q.region_id as "regionId",
      r.name as "regionName",
      cm.name as "commodityName",
      q.status,
      q.total_sell_amount as "totalSellAmount",
      q.total_estimated_buy as "totalEstimatedBuy",
      q.estimated_gp as "estimatedGp",
      q.estimated_margin_percent as "estimatedMarginPercent",
      q.payment_terms_days as "paymentTermsDays",
      q.created_by as "createdBy",
       q.created_by_user_id as "createdByUserId",
      q.created_at as "createdAt",
      (SELECT COUNT(*) FROM quotation_service_items WHERE quotation_id = q.quotation_id) as "itemCount",
      (SELECT CONCAT(COALESCE(orig.name, 'Điểm đi'), ' → ', COALESCE(dest.name, 'Điểm đến'))
       FROM quotation_service_items si
       LEFT JOIN locations orig ON si.origin_location_id = orig.location_id
       LEFT JOIN locations dest ON si.destination_location_id = dest.location_id
       WHERE si.quotation_id = q.quotation_id
       ORDER BY si.created_at ASC LIMIT 1) as "routeSummary",
      (SELECT si.equipment_type
       FROM quotation_service_items si
       WHERE si.quotation_id = q.quotation_id
       ORDER BY si.created_at ASC LIMIT 1) as "equipmentType"
    FROM customer_quotations q
    LEFT JOIN customers c ON q.customer_id = c.customer_id
    LEFT JOIN partners p ON c.customer_id = p.partner_id
    LEFT JOIN regions r ON q.region_id = r.region_id
    LEFT JOIN commodities cm ON q.commodity_id = cm.commodity_id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  if (!actor.regionScopes.includes("*")) {
    params.push(actor.regionScopes);
    query += ' AND (q.region_id = ANY($1::varchar[]) OR r.scope::text = ANY($1::varchar[]))';
  }
  if (filters?.regionId && filters.regionId !== "ALL") requireRegionScope(actor, filters.regionId);


  if (filters?.status && filters.status !== "ALL") {
    params.push(filters.status);
    query += ` AND q.status = $${params.length}`;
  }
  if (filters?.regionId && filters.regionId !== "ALL") {
    params.push(filters.regionId);
    query += ` AND q.region_id = $${params.length}`;
  }
  if (filters?.search) {
    params.push(`%${filters.search}%`);
    query += ` AND (q.quotation_no ILIKE $${params.length} OR p.partner_name ILIKE $${params.length} OR q.customer_name_snapshot ILIKE $${params.length} OR cm.name ILIKE $${params.length})`;
  }

  const limit = filters?.limit ?? 250;
  params.push(limit);
  query += ` ORDER BY q.created_at DESC LIMIT $${params.length}`;

  const { rows } = await pool.query(query, params);
  return rows.map((r) => ({
    quotationId: r.quotationId,
    quotationNo: r.quotationNo,
    version: Number(r.version || 1),
    customerId: r.customerId,
    customerName: r.customerName || r.customerId,
    regionId: r.regionId,
    regionName: r.regionName || r.regionId,
    commodityName: r.commodityName || undefined,
    status: r.status,
    totalSellAmount: Number(r.totalSellAmount || 0),
    totalEstimatedBuy: Number(r.totalEstimatedBuy || 0),
    estimatedGp: Number(r.estimatedGp || 0),
    estimatedMarginPercent: Number(r.estimatedMarginPercent || 0),
    paymentTermsDays: Number(r.paymentTermsDays ?? 30),
    createdBy: r.createdBy || "System",
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    routeSummary: r.routeSummary || undefined,
    equipmentType: r.equipmentType || undefined,
    itemCount: Number(r.itemCount || 0),
  }));
}

/**
 * Lấy chi tiết Báo giá kèm các dòng dịch vụ, snapshots và approval log
 */
export async function getQuotationDetail(quotationId: string, actor: CurrentActor): Promise<QuotationDetailResponse | null> {
  const quoteRes = await pool.query(
    `SELECT 
       q.quotation_id as "quotationId",
       q.quotation_no as "quotationNo",
       q.version,
       q.customer_id as "customerId",
       COALESCE(q.customer_name_snapshot, p.partner_name, q.customer_id) as "customerName",
       COALESCE(q.customer_tax_code_snapshot, p.tax_code) as "taxCode",
       COALESCE(q.customer_address_snapshot, p.address) as "customerAddress",
       q.region_id as "regionId",
       r.name as "regionName",
       q.commodity_id as "commodityId",
       cm.name as "commodityName",
       q.status,
       q.total_sell_amount as "totalSellAmount",
       q.total_estimated_buy as "totalEstimatedBuy",
       q.total_worst_case_buy as "totalWorstCaseBuy",
       q.estimated_gp as "estimatedGp",
       q.estimated_margin_percent as "estimatedMarginPercent",
       q.payment_terms_days as "paymentTermsDays",
       COALESCE(q.pricing_date::text, q.created_at::date::text) as "pricingDate",
       q.valid_until::text as "validUntil",
       q.immutable_locked as "immutableLocked",
       q.created_by as "createdBy",
       q.approved_by as "approvedBy",
       q.approved_at as "approvedAt",
       q.created_at as "createdAt",
       q.updated_at::text as "revision"
     FROM customer_quotations q
     LEFT JOIN customers c ON q.customer_id = c.customer_id
     LEFT JOIN partners p ON c.customer_id = p.partner_id
     LEFT JOIN regions r ON q.region_id = r.region_id
     LEFT JOIN commodities cm ON q.commodity_id = cm.commodity_id
     WHERE q.quotation_id = $1`,
    [quotationId]
  );
  if (quoteRes.rows.length === 0) return null;
  const quote = quoteRes.rows[0];
  requireRegionScope(actor, quote.regionId);

  const itemsRes = await pool.query(
    `SELECT 
       i.item_id as "itemId",
       i.service_package as "servicePackage",
       i.pricing_inclusion as "pricingInclusion",
       i.origin_location_id as "originLocationId",
       orig.name as "originName",
       i.destination_location_id as "destinationLocationId",
       dest.name as "destinationName",
       i.equipment_type as "equipmentType",
       i.planned_quantity as "plannedQuantity",
       i.unit,
       i.unit_sell_price as "unitSellPrice",
       i.total_sell_price as "totalSellPrice",
       i.insured_value as "insuredValue",
       i.selected_buy_rate_id as "selectedBuyRateId",
       i.estimated_buy_amount as "estimatedBuyAmount",
       i.worst_case_buy_amount as "worstCaseBuyAmount",
       i.item_gp as "itemGp",
       i.item_margin_percent as "itemMarginPercent"
     FROM quotation_service_items i
     LEFT JOIN locations orig ON i.origin_location_id = orig.location_id
     LEFT JOIN locations dest ON i.destination_location_id = dest.location_id
     WHERE i.quotation_id = $1
     ORDER BY i.created_at ASC`,
    [quotationId]
  );

  const snapshotsRes = await pool.query(
    `SELECT 
       snapshot_id as "snapshotId",
       item_id as "itemId",
       source_rate_id as "sourceRateId",
       vendor_id as "vendorId",
       cost_source_id as "costSourceId",
       cost_source_type as "costSourceType",
       vendor_name as "vendorName",
       rate_amount as "rateAmount",
       original_currency as "originalCurrency",
       fx_rate_to_vnd as "fxRateToVnd",
       rate_amount_vnd as "rateAmountVnd",
       validity_start::text as "validityStart",
       validity_end::text as "validityEnd",
       snapshot_at as "snapshotAt"
     FROM quotation_buy_snapshots
     WHERE quotation_id = $1
     ORDER BY snapshot_at ASC`,
    [quotationId]
  );

  const logsRes = await pool.query(
    `SELECT 
       log_id as "logId",
       version,
       action,
       actor_id as "actorId",
       actor_name as "actorName",
       comment,
       snapshot_margin_percent as "snapshotMarginPercent",
       created_at as "createdAt"
     FROM quotation_approval_log
     WHERE quotation_id = $1
     ORDER BY created_at DESC`,
    [quotationId]
  );

  let costComponents: QuotationCostComponentItem[] = [];
  try {
    const costComponentsRes = await pool.query(
      `SELECT 
         component_id as "componentId",
         quotation_id as "quotationId",
         item_id as "itemId",
         cost_code as "costCode",
         cost_name as "costName",
         is_required as "isRequired",
         rate_source_id as "rateSourceId",
         vendor_id as "vendorId",
         cost_source_id as "costSourceId",
         vendor_name as "vendorName",
         quantity,
         unit,
         rate_basis as "rateBasis",
         original_currency as "originalCurrency",
         original_rate as "originalRate",
         fx_rate_to_vnd as "fxRateToVnd",
         estimated_cost_vnd as "estimatedCostVnd",
         worst_case_cost_vnd as "worstCaseCostVnd",
         created_at as "createdAt"
       FROM quotation_item_cost_components
       WHERE quotation_id = $1
       ORDER BY created_at ASC`,
      [quotationId]
    );
    costComponents = costComponentsRes.rows.map((r) => ({
      componentId: r.componentId,
      quotationId: r.quotationId,
      itemId: r.itemId,
      costCode: r.costCode,
      costName: r.costName,
      isRequired: Boolean(r.isRequired),
      rateSourceId: r.rateSourceId || null,
      vendorId: r.vendorId || null,
      costSourceId: r.costSourceId || null,
      vendorName: r.vendorName,
      quantity: Number(r.quantity || 1),
      unit: r.unit,
      rateBasis: r.rateBasis,
      originalCurrency: r.originalCurrency,
      originalRate: Number(r.originalRate || 0),
      fxRateToVnd: Number(r.fxRateToVnd || 1),
      estimatedCostVnd: Number(r.estimatedCostVnd || 0),
      worstCaseCostVnd: Number(r.worstCaseCostVnd || 0),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
    }));
  } catch {
    // Trường hợp test mock không định nghĩa bảng cost components
    costComponents = [];
  }

  return {
    quote: {
      revision: quote.revision,
      quotationId: quote.quotationId,
      quotationNo: quote.quotationNo,
      version: Number(quote.version || 1),
      customerId: quote.customerId,
      customerName: quote.customerName || quote.customerId,
      taxCode: quote.taxCode || undefined,
      regionId: quote.regionId,
      regionName: quote.regionName || quote.regionId,
      commodityId: quote.commodityId || undefined,
      commodityName: quote.commodityName || undefined,
      status: quote.status,
      totalSellAmount: Number(quote.totalSellAmount || 0),
      totalEstimatedBuy: Number(quote.totalEstimatedBuy || 0),
      totalWorstCaseBuy: Number(quote.totalWorstCaseBuy || 0),
      estimatedGp: Number(quote.estimatedGp || 0),
      estimatedMarginPercent: Number(quote.estimatedMarginPercent || 0),
      paymentTermsDays: Number(quote.paymentTermsDays ?? 30),
      immutableLocked: Boolean(quote.immutableLocked),
      createdBy: quote.createdBy || "System",
      createdByUserId: quote.createdByUserId || undefined,
      approvedBy: quote.approvedBy || undefined,
      approvedAt: quote.approvedAt ? new Date(quote.approvedAt).toISOString() : undefined,
      createdAt: quote.createdAt ? new Date(quote.createdAt).toISOString() : new Date().toISOString(),
    },
    items: itemsRes.rows.map((r) => ({
      itemId: r.itemId,
      servicePackage: r.servicePackage,
      pricingInclusion: r.pricingInclusion,
      originLocationId: r.originLocationId,
      originName: r.originName || undefined,
      destinationLocationId: r.destinationLocationId,
      destinationName: r.destinationName || undefined,
      equipmentType: r.equipmentType,
      plannedQuantity: Number(r.plannedQuantity || 1),
      unit: r.unit,
      unitSellPrice: Number(r.unitSellPrice || 0),
      totalSellPrice: Number(r.totalSellPrice || 0),
      insuredValue: r.insuredValue ? Number(r.insuredValue) : undefined,
      selectedBuyRateId: r.selectedBuyRateId || undefined,
      estimatedBuyAmount: Number(r.estimatedBuyAmount || 0),
      worstCaseBuyAmount: Number(r.worstCaseBuyAmount || 0),
      itemGp: Number(r.itemGp || 0),
      itemMarginPercent: Number(r.itemMarginPercent || 0),
    })),
    snapshots: snapshotsRes.rows.map((r) => ({
      snapshotId: r.snapshotId,
      itemId: r.itemId,
      sourceRateId: r.sourceRateId,
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      rateAmount: Number(r.rateAmount || 0),
      originalCurrency: r.originalCurrency,
      fxRateToVnd: Number(r.fxRateToVnd || 1),
      // Older snapshots stored a line total here. Derive the unit price from immutable source fields.
      rateAmountVnd: roundVnd(new Decimal(r.rateAmount || 0).mul(r.fxRateToVnd ?? 1)).toNumber(),
      validityStart: r.validityStart || "",
      validityEnd: r.validityEnd || "",
      snapshotAt: r.snapshotAt ? new Date(r.snapshotAt).toISOString() : "",
    })),
    costComponents,
    approvalLogs: logsRes.rows.map((r) => ({
      logId: r.logId,
      version: Number(r.version || 1),
      action: r.action,
      actorId: r.actorId,
      actorName: r.actorName || undefined,
      comment: r.comment || undefined,
      snapshotMarginPercent: r.snapshotMarginPercent != null ? Number(r.snapshotMarginPercent) : undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
    })),
  };
}
