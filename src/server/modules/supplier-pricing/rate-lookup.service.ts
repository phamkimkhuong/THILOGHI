import { pool } from "@/server/db";

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
  fxRateToVnd: number;
  buyRateVnd: number;
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
 * Tỷ giá quy đổi cố định nội bộ chuẩn hóa về VND (có thể mở rộng từ bảng fx_rates)
 */
export const FX_RATES_TO_VND: Record<string, number> = {
  VND: 1.0,
  USD: 25450.0,
  LAK: 1.18,
  KHR: 6.25,
};

export class UnsupportedCurrencyError extends Error {
  constructor(currency: string) {
    super(`Loại tiền tệ [${currency}] chưa được cấu hình tỷ giá quy đổi sang VND. Vui lòng kiểm tra bảng tỷ giá.`);
    this.name = "UnsupportedCurrencyError";
  }
}

export function getFxRateToVnd(currency: string): number {
  const code = (currency || "").trim().toUpperCase();
  const rate = FX_RATES_TO_VND[code];
  if (rate === undefined) {
    throw new UnsupportedCurrencyError(currency);
  }
  return rate;
}

/**
 * Thuật toán Tra cứu Giá mua Đầu vào (BUY Rate Lookup Engine v1.1)
 * Tuân thủ quy tắc 4 bước: Search Candidates -> Validate Overlap -> Normalize FX -> Select -> Worst-case
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

  // 2. Chuẩn hóa tỷ giá ngoại tệ về VND cho từng candidate
  const candidates: RateCandidate[] = rows.map((r) => {
    const rawRate = Number(r.buy_rate);
    const curr = (r.currency || "VND").toUpperCase();
    const fx = getFxRateToVnd(curr);
    const buyVnd = Math.round(rawRate * fx);

    return {
      rateId: r.rate_id,
      vendorId: r.vendor_id,
      vendorName: r.vendor_name,
      buyRate: rawRate,
      currency: curr,
      fxRateToVnd: fx,
      buyRateVnd: buyVnd,
      validityRange: r.validity_range,
    };
  });

  // 3. Sắp xếp các lựa chọn theo giá quy đổi VND tăng dần (lợi thế chi phí nhất lên đầu)
  candidates.sort((a, b) => a.buyRateVnd - b.buyRateVnd);

  // 4. Kiểm tra xung đột: Cùng 1 vendor có >1 bảng giá trùng dải ngày không?
  // (PostgreSQL Exclusion Constraint đã chặn ở tầng DB, đây là tầng phòng thủ bổ trợ)
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

  // 5. Tính Worst-case BUY (giá cao nhất theo VND trong các phương án bắt buộc)
  const worstCase = candidates.reduce(
    (max, c) => (c.buyRateVnd > max ? c.buyRateVnd : max),
    candidates[0].buyRateVnd
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
