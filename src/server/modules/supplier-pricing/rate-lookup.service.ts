import { pool } from "@/server/db";
import Decimal from "decimal.js";

export interface RateLookupQuery {
  pickupLocationId: string;
  deliveryLocationId: string;
  equipmentType: string;
  pricingDate: string; // YYYY-MM-DD
}

export interface RateCandidate {
  rateId: string;
  vendorId: string;
  vendorName: string;
  buyRate: number;
  currency: string;
  validityRange: string;
}

export interface RateLookupResult {
  status: "MISSING_RATE" | "APPLY" | "MULTIPLE_CANDIDATES" | "CONFLICT_RATE";
  candidates: RateCandidate[];
  selectedRate?: RateCandidate;
  worstCaseBuy?: number;
  message?: string;
}

/**
 * Thuật toán Tra cứu Giá mua Đầu vào (BUY Rate Lookup Engine)
 * Tuân thủ quy tắc 4 bước: Search Candidates -> Validate Overlap -> Select -> Worst-case
 */
export async function lookupRoadRates(query: RateLookupQuery): Promise<RateLookupResult> {
  // 1. Tìm kiếm tất cả các bảng giá của các Vendor còn hiệu lực tại ngày pricingDate
  const sql = `
    SELECT 
      r.rate_id,
      r.vendor_id,
      v.vendor_name,
      r.buy_rate,
      r.currency,
      r.validity_range::text
    FROM road_rates r
    JOIN vendors v ON r.vendor_id = v.vendor_id
    WHERE r.pickup_location_id = $1
      AND r.delivery_location_id = $2
      AND r.equipment_type = $3
      AND r.status = 'APPROVED'
      AND r.validity_range @> $4::date
    ORDER BY r.buy_rate ASC;
  `;

  const { rows } = await pool.query(sql, [
    query.pickupLocationId,
    query.deliveryLocationId,
    query.equipmentType,
    query.pricingDate,
  ]);

  if (rows.length === 0) {
    return {
      status: "MISSING_RATE",
      candidates: [],
      message: "Không tìm thấy bảng giá mua hợp lệ cho tuyến đường và ngày yêu cầu.",
    };
  }

  const candidates: RateCandidate[] = rows.map((r) => ({
    rateId: r.rate_id,
    vendorId: r.vendor_id,
    vendorName: r.vendor_name,
    buyRate: Number(r.buy_rate),
    currency: r.currency,
    validityRange: r.validity_range,
  }));

  // 2. Kiểm tra xung đột: Cùng 1 vendor có >1 bảng giá trùng dải ngày không?
  // (Lưu ý: PostgreSQL Exclusion Constraint đã chặn ở tầng DB, đây là tầng phòng thủ bổ trợ)
  const vendorCounts = new Map<string, number>();
  for (const c of candidates) {
    vendorCounts.set(c.vendorId, (vendorCounts.get(c.vendorId) || 0) + 1);
    if ((vendorCounts.get(c.vendorId) || 0) > 1) {
      return {
        status: "CONFLICT_RATE",
        candidates,
        message: `Phát hiện xung đột dải ngày hiệu lực của cùng Nhà cung cấp [${c.vendorName}].`,
      };
    }
  }

  // 3. Tính Worst-case BUY (giá cao nhất trong các phương án bắt buộc)
  const worstCase = candidates.reduce(
    (max, c) => (c.buyRate > max ? c.buyRate : max),
    candidates[0].buyRate
  );

  if (candidates.length === 1) {
    return {
      status: "APPLY",
      candidates,
      selectedRate: candidates[0],
      worstCaseBuy: worstCase,
    };
  }

  return {
    status: "MULTIPLE_CANDIDATES",
    candidates,
    selectedRate: candidates[0], // Gợi ý mặc định phương án giá tối ưu nhất
    worstCaseBuy: worstCase,
  };
}
