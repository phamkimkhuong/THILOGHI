import { pool } from "@/server/db";
import { requireRole } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";
import { roundVnd } from "@/shared/utils/pricing";
import { getEquivalentEquipmentCodes } from "@/shared/utils/equipment";

export interface OceanRateItem {
  rateId: string;
  carrierId: string;
  carrierName: string;
  polId: string;
  polName: string;
  podId: string;
  podName: string;
  commodityName: string;
  containerType: string;
  oceanFreightUsd: number;
  thcFee: number;
  docsFee: number;
  sealFee: number;
  afsFee: number;
  telexFee: number;
  bafCafFee: number;
  otherSurcharges: number;
  totalChargesVnd: number;
  currency: string;
  validFrom: string;
  validTo: string;
  status: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

import { STANDARD_USD_FX_RATE } from "@/shared/utils/pricing";

/**
 * Tỷ giá quy đổi chuẩn USD -> VND cho vận tải biển (kế thừa từ chuẩn toàn hệ thống 25.450)
 */
export const OCEAN_FX_RATE_USD_VND = STANDARD_USD_FX_RATE;

/**
 * Lấy danh sách hãng tàu vận tải biển trực tiếp từ Master Data (vendors JOIN partners)
 */
export async function getOceanCarriersList(): Promise<{ carrierId: string; carrierName: string }[]> {
  const query = `
    SELECT 
      v.vendor_id as "carrierId",
      p.partner_name as "carrierName"
    FROM vendors v
    JOIN partners p ON v.vendor_id = p.partner_id
    WHERE v.vendor_type = 'OCEAN_CARRIER'
    ORDER BY p.partner_name ASC;
  `;
  const { rows } = await pool.query(query);
  return (rows || []).map((r) => ({
    carrierId: r.carrierId,
    carrierName: r.carrierName,
  }));
}

/**
 * Lấy danh sách cảng biển (Port) trực tiếp từ locations
 */
export async function getOceanPortsList(): Promise<{ portId: string; portName: string; countryCode: string }[]> {
  const query = `
    SELECT 
      location_id as "portId",
      name as "portName",
      country_code as "countryCode"
    FROM locations
    WHERE location_type = 'Port'
    ORDER BY name ASC;
  `;
  const { rows } = await pool.query(query);
  return (rows || []).map((r) => ({
    portId: r.portId,
    portName: r.portName,
    countryCode: r.countryCode,
  }));
}

/**
 * Lấy danh sách chi tiết các biểu cước Vận tải biển trực tiếp từ PostgreSQL
 */
export async function getOceanRatesDetailedList(filters?: {
  search?: string;
  carrierId?: string;
  polId?: string;
  podId?: string;
  containerType?: string;
  status?: string;
}): Promise<OceanRateItem[]> {
  let query = `
    SELECT 
      rate_id as "rateId",
      carrier_id as "carrierId",
      carrier_name as "carrierName",
      pol_id as "polId",
      pol_name as "polName",
      pod_id as "podId",
      pod_name as "podName",
      commodity_name as "commodityName",
      container_type as "containerType",
      ocean_freight_usd as "oceanFreightUsd",
      thc_fee as "thcFee",
      docs_fee as "docsFee",
      seal_fee as "sealFee",
      afs_fee as "afsFee",
      telex_fee as "telexFee",
      baf_caf_fee as "bafCafFee",
      other_surcharges as "otherSurcharges",
      total_charges_vnd as "totalChargesVnd",
      currency,
      lower(validity_range)::text as "validFrom",
      upper(validity_range)::text as "validTo",
      status,
      notes,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM ocean_rates
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.carrierId && filters.carrierId !== "ALL") {
    params.push(filters.carrierId);
    query += ` AND carrier_id = $${params.length}`;
  }

  if (filters?.polId && filters.polId !== "ALL") {
    params.push(filters.polId);
    query += ` AND pol_id = $${params.length}`;
  }

  if (filters?.podId && filters.podId !== "ALL") {
    params.push(filters.podId);
    query += ` AND pod_id = $${params.length}`;
  }

  if (filters?.containerType && filters.containerType !== "ALL") {
    const eqCodes = getEquivalentEquipmentCodes(filters.containerType);
    params.push(eqCodes);
    query += ` AND container_type = ANY($${params.length}::varchar[])`;
  }

  if (filters?.status && filters.status !== "ALL") {
    params.push(filters.status);
    query += ` AND status = $${params.length}`;
  }

  if (filters?.search) {
    params.push(`%${filters.search}%`);
    query += ` AND (
      carrier_id ILIKE $${params.length} OR 
      carrier_name ILIKE $${params.length} OR 
      pol_id ILIKE $${params.length} OR 
      pol_name ILIKE $${params.length} OR 
      pod_id ILIKE $${params.length} OR 
      pod_name ILIKE $${params.length} OR 
      commodity_name ILIKE $${params.length} OR 
      container_type ILIKE $${params.length} OR 
      notes ILIKE $${params.length}
    )`;
  }

  query += ` ORDER BY carrier_id ASC, pol_name ASC, pod_name ASC`;

  const { rows } = await pool.query(query, params);

  return (rows || []).map((r) => ({
    rateId: r.rateId,
    carrierId: r.carrierId,
    carrierName: r.carrierName,
    polId: r.polId,
    polName: r.polName,
    podId: r.podId,
    podName: r.podName,
    commodityName: r.commodityName || "",
    containerType: r.containerType || "40HR",
    oceanFreightUsd: Number(r.oceanFreightUsd || 0),
    thcFee: Number(r.thcFee || 0),
    docsFee: Number(r.docsFee || 0),
    sealFee: Number(r.sealFee || 0),
    afsFee: Number(r.afsFee || 0),
    telexFee: Number(r.telexFee || 0),
    bafCafFee: Number(r.bafCafFee || 0),
    otherSurcharges: Number(r.otherSurcharges || 0),
    totalChargesVnd: Number(r.totalChargesVnd || 0),
    currency: r.currency || "USD",
    validFrom: r.validFrom || "2026-01-01",
    validTo: r.validTo || "2026-12-31",
    status: r.status || "ACTIVE",
    notes: r.notes || "",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export interface SaveOceanRateInput {
  rateId?: string;
  carrierId: string;
  carrierName: string;
  polId: string;
  polName: string;
  podId: string;
  podName: string;
  commodityName?: string;
  containerType: string;
  oceanFreightUsd: number;
  thcFee?: number;
  docsFee?: number;
  sealFee?: number;
  afsFee?: number;
  telexFee?: number;
  bafCafFee?: number;
  otherSurcharges?: number;
  currency?: string;
  validFrom: string;
  validTo: string;
  status?: string;
  notes?: string;
}

/**
 * Lưu hoặc cập nhật biểu cước Vận tải biển trực tiếp vào PostgreSQL
 */
export async function saveOceanRateService(
  input: SaveOceanRateInput,
  actor: CurrentActor
): Promise<OceanRateItem> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);

  const oceanFreightUsd = Number(input.oceanFreightUsd || 0);
  const thcFee = Number(input.thcFee || 0);
  const docsFee = Number(input.docsFee || 0);
  const sealFee = Number(input.sealFee || 0);
  const afsFee = Number(input.afsFee || 0);
  const telexFee = Number(input.telexFee || 0);
  const bafCafFee = Number(input.bafCafFee || 0);
  const otherSurcharges = Number(input.otherSurcharges || 0);

  // Quy đổi USD -> VND và cộng gộp toàn bộ local charges
  const totalChargesVnd = roundVnd(
    oceanFreightUsd * OCEAN_FX_RATE_USD_VND +
    thcFee +
    docsFee +
    sealFee +
    afsFee +
    telexFee +
    bafCafFee +
    otherSurcharges
  ).toNumber();

  const carrierId = input.carrierId.trim().toUpperCase();
  const carrierName = input.carrierName.trim();
  const polId = input.polId.trim().toUpperCase();
  const polName = input.polName.trim();
  const podId = input.podId.trim().toUpperCase();
  const podName = input.podName.trim();
  const commodityName = input.commodityName?.trim();
  if (!commodityName) {
    throw new Error("Mặt hàng áp dụng là bắt buộc.");
  }
  const containerType = input.containerType?.trim() || "40HR";
  const currency = input.currency || "USD";
  const validFrom = input.validFrom || "2026-01-01";
  const validTo = input.validTo || "2026-12-31";
  const status = input.status || "ACTIVE";
  const notes = input.notes?.trim() || "";

  if (input.rateId) {
    const updateQuery = `
      UPDATE ocean_rates SET
        carrier_id = $1,
        carrier_name = $2,
        pol_id = $3,
        pol_name = $4,
        pod_id = $5,
        pod_name = $6,
        commodity_name = $7,
        container_type = $8,
        ocean_freight_usd = $9,
        thc_fee = $10,
        docs_fee = $11,
        seal_fee = $12,
        afs_fee = $13,
        telex_fee = $14,
        baf_caf_fee = $15,
        other_surcharges = $16,
        total_charges_vnd = $17,
        currency = $18,
        validity_range = daterange($19, $20, '[)'),
        status = $21,
        notes = $22,
        updated_at = CURRENT_TIMESTAMP
      WHERE rate_id = $23
      RETURNING *;
    `;
    const { rows } = await pool.query(updateQuery, [
      carrierId,
      carrierName,
      polId,
      polName,
      podId,
      podName,
      commodityName,
      containerType,
      oceanFreightUsd,
      thcFee,
      docsFee,
      sealFee,
      afsFee,
      telexFee,
      bafCafFee,
      otherSurcharges,
      totalChargesVnd,
      currency,
      validFrom,
      validTo,
      status,
      notes,
      input.rateId,
    ]);

    if (!rows || rows.length === 0) {
      throw new Error("Không tìm thấy biểu cước vận tải biển cần cập nhật.");
    }

    const r = rows[0];
    return {
      rateId: r.rate_id,
      carrierId: r.carrier_id,
      carrierName: r.carrier_name,
      polId: r.pol_id,
      polName: r.pol_name,
      podId: r.pod_id,
      podName: r.pod_name,
      commodityName: r.commodity_name,
      containerType: r.container_type,
      oceanFreightUsd: Number(r.ocean_freight_usd),
      thcFee: Number(r.thc_fee),
      docsFee: Number(r.docs_fee),
      sealFee: Number(r.seal_fee),
      afsFee: Number(r.afs_fee),
      telexFee: Number(r.telex_fee),
      bafCafFee: Number(r.baf_caf_fee),
      otherSurcharges: Number(r.other_surcharges),
      totalChargesVnd: Number(r.total_charges_vnd),
      currency: r.currency,
      validFrom,
      validTo,
      status: r.status,
      notes: r.notes || "",
    };
  }

  const insertQuery = `
    INSERT INTO ocean_rates (
      carrier_id, carrier_name, pol_id, pol_name, pod_id, pod_name,
      commodity_name, container_type, ocean_freight_usd, thc_fee,
      docs_fee, seal_fee, afs_fee, telex_fee, baf_caf_fee, other_surcharges,
      total_charges_vnd, currency, validity_range, status, notes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
      daterange($19, $20, '[)'), $21, $22
    )
    RETURNING *;
  `;
  const { rows } = await pool.query(insertQuery, [
    carrierId,
    carrierName,
    polId,
    polName,
    podId,
    podName,
    commodityName,
    containerType,
    oceanFreightUsd,
    thcFee,
    docsFee,
    sealFee,
    afsFee,
    telexFee,
    bafCafFee,
    otherSurcharges,
    totalChargesVnd,
    currency,
    validFrom,
    validTo,
    status,
    notes,
  ]);

  const r = rows[0];
  return {
    rateId: r.rate_id,
    carrierId: r.carrier_id,
    carrierName: r.carrier_name,
    polId: r.pol_id,
    polName: r.pol_name,
    podId: r.pod_id,
    podName: r.pod_name,
    commodityName: r.commodity_name,
    containerType: r.container_type,
    oceanFreightUsd: Number(r.ocean_freight_usd),
    thcFee: Number(r.thc_fee),
    docsFee: Number(r.docs_fee),
    sealFee: Number(r.seal_fee),
    afsFee: Number(r.afs_fee),
    telexFee: Number(r.telex_fee),
    bafCafFee: Number(r.baf_caf_fee),
    otherSurcharges: Number(r.other_surcharges),
    totalChargesVnd: Number(r.total_charges_vnd),
    currency: r.currency,
    validFrom,
    validTo,
    status: r.status,
    notes: r.notes || "",
  };
}

/**
 * Đổi trạng thái biểu cước Vận tải biển trong PostgreSQL
 */
export async function toggleOceanRateStatusService(
  rateId: string,
  status: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);
  await pool.query("UPDATE ocean_rates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE rate_id = $2", [
    status,
    rateId,
  ]);
}

/**
 * Xóa biểu cước Vận tải biển trong PostgreSQL
 */
export async function deleteOceanRateService(
  rateId: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  await pool.query("DELETE FROM ocean_rates WHERE rate_id = $1", [rateId]);
}

export interface OceanRateLookupQuery {
  carrierId?: string;
  polId?: string;
  podId?: string;
  containerType?: string;
  commodityName?: string;
  pricingDate?: string;
  validityDate?: string;
}

export interface OceanRateLookupResult {
  status: "MATCHED" | "MISSING_RATE" | "CONFLICT_RATE" | "MULTIPLE_CANDIDATES";
  message: string;
  rate?: OceanRateItem;
  candidates: OceanRateItem[];
}

/**
 * Tra cứu tự động biểu cước Vận tải biển từ PostgreSQL theo tuyến cảng (POL -> POD), hãng tàu và loại cont
 */
export async function lookupOceanRates(
  query: OceanRateLookupQuery
): Promise<OceanRateLookupResult> {
  const targetDate = query.pricingDate || query.validityDate;

  const allRates = await getOceanRatesDetailedList({
    status: "ACTIVE",
    carrierId: query.carrierId,
    polId: query.polId,
    podId: query.podId,
    containerType: query.containerType,
  });

  const matching = allRates.filter((r) => {
    if (query.carrierId && query.carrierId !== "ALL" && r.carrierId !== query.carrierId) {
      return false;
    }
    if (query.polId && query.polId !== "ALL" && r.polId !== query.polId) {
      return false;
    }
    if (query.podId && query.podId !== "ALL" && r.podId !== query.podId) {
      return false;
    }
    if (query.containerType && query.containerType !== "ALL") {
      const eqCodes = getEquivalentEquipmentCodes(query.containerType);
      if (!eqCodes.includes(r.containerType)) return false;
    }
    if (targetDate) {
      if (r.validFrom && targetDate < r.validFrom) return false;
      if (r.validTo && targetDate >= r.validTo) return false;
    }
    if (query.commodityName && query.commodityName !== "ALL") {
      const qComm = query.commodityName.toLowerCase().trim();
      const rComm = (r.commodityName || "").toLowerCase().trim();
      if (!rComm.includes(qComm) && !qComm.includes(rComm)) {
        return false;
      }
    }
    return true;
  });

  if (matching.length === 0) {
    return {
      status: "MISSING_RATE",
      message: "Không tìm thấy biểu cước vận tải biển phù hợp với tuyến cảng, loại cont và mặt hàng đã chọn.",
      candidates: [],
    };
  }

  if (matching.length === 1) {
    return {
      status: "MATCHED",
      message: "Tìm thấy biểu cước vận tải biển hợp lệ.",
      rate: matching[0],
      candidates: matching,
    };
  }

  // Kiểm tra xung đột: Chỉ coi là xung đột nếu cùng Hãng tàu, POL, POD, container VÀ cùng Mặt hàng có >1 biểu cước hiệu lực cùng lúc
  const pricingKeyCounts = new Map<string, number>();
  for (const m of matching) {
    const key = `${m.carrierId}_${m.polId}_${m.podId}_${m.containerType}_${(m.commodityName || "").toLowerCase().trim()}`;
    pricingKeyCounts.set(key, (pricingKeyCounts.get(key) || 0) + 1);
    if ((pricingKeyCounts.get(key) || 0) > 1) {
      return {
        status: "CONFLICT_RATE",
        message: `Phát hiện xung đột biểu cước trùng lặp của Hãng tàu [${m.carrierName}] cho mặt hàng [${m.commodityName}].`,
        candidates: matching,
      };
    }
  }

  return {
    status: "MULTIPLE_CANDIDATES",
    message: `Tìm thấy ${matching.length} phương án hãng tàu/mặt hàng khả dụng. Vui lòng chọn phương án phù hợp.`,
    rate: matching[0],
    candidates: matching,
  };
}

