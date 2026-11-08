import { pool } from "@/server/db";
import { requireRole } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";
import { roundVnd } from "@/shared/utils/pricing";

export interface BorderRateItem {
  rateId: string;
  borderPairId: string;
  borderPairName: string;
  countryPair: string;
  provinces: string;
  commodityName: string;
  infrastructureFee: number;
  entryExitFee: number;
  customsFee: number;
  totalFee: number;
  currency: string;
  validFrom: string;
  validTo: string;
  status: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Lấy danh sách chi tiết các biểu phí Cửa khẩu trực tiếp từ PostgreSQL
 */
export async function getBorderRatesDetailedList(filters?: {
  search?: string;
  borderPairId?: string;
  countryPair?: string;
  status?: string;
}): Promise<BorderRateItem[]> {
  let query = `
    SELECT 
      rate_id as "rateId",
      border_pair_id as "borderPairId",
      border_pair_name as "borderPairName",
      country_pair as "countryPair",
      provinces,
      commodity_name as "commodityName",
      infrastructure_fee as "infrastructureFee",
      entry_exit_fee as "entryExitFee",
      customs_fee as "customsFee",
      total_fee as "totalFee",
      currency,
      lower(validity_range)::text as "validFrom",
      upper(validity_range)::text as "validTo",
      status,
      notes,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM border_rates
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.borderPairId && filters.borderPairId !== "ALL") {
    params.push(filters.borderPairId);
    query += ` AND border_pair_id = $${params.length}`;
  }

  if (filters?.countryPair && filters.countryPair !== "ALL") {
    params.push(filters.countryPair);
    query += ` AND country_pair = $${params.length}`;
  }

  if (filters?.status && filters.status !== "ALL") {
    params.push(filters.status);
    query += ` AND status = $${params.length}`;
  }

  if (filters?.search) {
    params.push(`%${filters.search}%`);
    query += ` AND (border_pair_id ILIKE $${params.length} OR border_pair_name ILIKE $${params.length} OR country_pair ILIKE $${params.length} OR provinces ILIKE $${params.length} OR commodity_name ILIKE $${params.length} OR notes ILIKE $${params.length})`;
  }

  query += ` ORDER BY border_pair_id ASC, commodity_name ASC`;

  const { rows } = await pool.query(query, params);

  return (rows || []).map((r) => ({
    rateId: r.rateId,
    borderPairId: r.borderPairId,
    borderPairName: r.borderPairName,
    countryPair: r.countryPair,
    provinces: r.provinces || "",
    commodityName: r.commodityName,
    infrastructureFee: Number(r.infrastructureFee || 0),
    entryExitFee: Number(r.entryExitFee || 0),
    customsFee: Number(r.customsFee || 0),
    totalFee: Number(r.totalFee || 0),
    currency: r.currency,
    validFrom: r.validFrom || "2026-01-01",
    validTo: r.validTo || "2026-12-31",
    status: r.status || "ACTIVE",
    notes: r.notes || "",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export interface SaveBorderRateInput {
  rateId?: string;
  borderPairId: string;
  borderPairName: string;
  countryPair: string;
  provinces?: string;
  commodityName: string;
  infrastructureFee: number;
  entryExitFee: number;
  customsFee: number;
  currency?: string;
  validFrom: string;
  validTo: string;
  status?: string;
  notes?: string;
}

/**
 * Lưu hoặc cập nhật biểu phí Cửa khẩu trực tiếp vào PostgreSQL
 */
export async function saveBorderRateService(
  input: SaveBorderRateInput,
  actor: CurrentActor
): Promise<BorderRateItem> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);

  const totalFee = roundVnd(
    Number(input.infrastructureFee || 0) +
    Number(input.entryExitFee || 0) +
    Number(input.customsFee || 0)
  ).toNumber();

  const borderPairId = input.borderPairId.trim().toUpperCase();
  const borderPairName = input.borderPairName.trim();
  const countryPair = input.countryPair || "Việt - Lào";
  const provinces = input.provinces?.trim() || "";
  const commodityName = input.commodityName?.trim() || "Tất cả loại hàng";
  const infrastructureFee = Number(input.infrastructureFee || 0);
  const entryExitFee = Number(input.entryExitFee || 0);
  const customsFee = Number(input.customsFee || 0);
  const currency = input.currency || "VND";
  const validFrom = input.validFrom || "2026-01-01";
  const validTo = input.validTo || "2026-12-31";
  const status = input.status || "ACTIVE";
  const notes = input.notes?.trim() || "";

  if (input.rateId) {
    const updateQuery = `
      UPDATE border_rates SET
        border_pair_id = $1,
        border_pair_name = $2,
        country_pair = $3,
        provinces = $4,
        commodity_name = $5,
        infrastructure_fee = $6,
        entry_exit_fee = $7,
        customs_fee = $8,
        total_fee = $9,
        currency = $10,
        validity_range = daterange($11, $12, '[)'),
        status = $13,
        notes = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE rate_id = $15
      RETURNING *;
    `;
    const { rows } = await pool.query(updateQuery, [
      borderPairId,
      borderPairName,
      countryPair,
      provinces,
      commodityName,
      infrastructureFee,
      entryExitFee,
      customsFee,
      totalFee,
      currency,
      validFrom,
      validTo,
      status,
      notes,
      input.rateId,
    ]);

    if (!rows || rows.length === 0) {
      throw new Error("Không tìm thấy biểu phí cửa khẩu cần cập nhật.");
    }

    const r = rows[0];
    return {
      rateId: r.rate_id,
      borderPairId: r.border_pair_id,
      borderPairName: r.border_pair_name,
      countryPair: r.country_pair,
      provinces: r.provinces || "",
      commodityName: r.commodity_name,
      infrastructureFee: Number(r.infrastructure_fee),
      entryExitFee: Number(r.entry_exit_fee),
      customsFee: Number(r.customs_fee),
      totalFee: Number(r.total_fee),
      currency: r.currency,
      validFrom,
      validTo,
      status: r.status,
      notes: r.notes || "",
    };
  }

  const insertQuery = `
    INSERT INTO border_rates (
      border_pair_id, border_pair_name, country_pair, provinces,
      commodity_name, infrastructure_fee, entry_exit_fee, customs_fee,
      total_fee, currency, validity_range, status, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, daterange($11, $12, '[)'), $13, $14)
    RETURNING *;
  `;
  const { rows } = await pool.query(insertQuery, [
    borderPairId,
    borderPairName,
    countryPair,
    provinces,
    commodityName,
    infrastructureFee,
    entryExitFee,
    customsFee,
    totalFee,
    currency,
    validFrom,
    validTo,
    status,
    notes,
  ]);

  const r = rows[0];
  return {
    rateId: r.rate_id,
    borderPairId: r.border_pair_id,
    borderPairName: r.border_pair_name,
    countryPair: r.country_pair,
    provinces: r.provinces || "",
    commodityName: r.commodity_name,
    infrastructureFee: Number(r.infrastructure_fee),
    entryExitFee: Number(r.entry_exit_fee),
    customsFee: Number(r.customs_fee),
    totalFee: Number(r.total_fee),
    currency: r.currency,
    validFrom,
    validTo,
    status: r.status,
    notes: r.notes || "",
  };
}

/**
 * Đổi trạng thái biểu phí Cửa khẩu trong PostgreSQL
 */
export async function toggleBorderRateStatusService(
  rateId: string,
  status: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);
  await pool.query("UPDATE border_rates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE rate_id = $2", [
    status,
    rateId,
  ]);
}

/**
 * Xóa biểu phí Cửa khẩu trong PostgreSQL
 */
export async function deleteBorderRateService(
  rateId: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  await pool.query("DELETE FROM border_rates WHERE rate_id = $1", [rateId]);
}

export interface BorderRateLookupQuery {
  borderPairId?: string;
  countryPair?: string;
  commodityName?: string;
  pricingDate?: string;
}

export interface BorderRateLookupResult {
  status: "MATCHED" | "MISSING_RATE" | "CONFLICT_RATE";
  message: string;
  rate?: BorderRateItem;
  candidates: BorderRateItem[];
}

/**
 * Tra cứu tự động biểu cước Cửa khẩu từ PostgreSQL theo cặp cửa khẩu và mặt hàng
 */
export async function lookupBorderRates(
  query: BorderRateLookupQuery
): Promise<BorderRateLookupResult> {
  const allRates = await getBorderRatesDetailedList({
    status: "ACTIVE",
    borderPairId: query.borderPairId,
    countryPair: query.countryPair,
  });

  const matching = allRates.filter((r) => {
    if (query.borderPairId && query.borderPairId !== "ALL" && r.borderPairId !== query.borderPairId) {
      return false;
    }
    if (query.countryPair && query.countryPair !== "ALL" && r.countryPair !== query.countryPair) {
      return false;
    }
    if (query.commodityName && r.commodityName !== "Tất cả loại hàng" && !r.commodityName.toLowerCase().includes(query.commodityName.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (matching.length === 0) {
    return {
      status: "MISSING_RATE",
      message: "Không tìm thấy biểu phí cửa khẩu phù hợp với cặp cửa khẩu đã chọn.",
      candidates: [],
    };
  }

  if (matching.length === 1) {
    return {
      status: "MATCHED",
      message: "Tìm thấy biểu phí cửa khẩu hợp lệ.",
      rate: matching[0],
      candidates: matching,
    };
  }

  return {
    status: "CONFLICT_RATE",
    message: "Tìm thấy nhiều biểu phí cửa khẩu khả dụng.",
    candidates: matching,
  };
}
