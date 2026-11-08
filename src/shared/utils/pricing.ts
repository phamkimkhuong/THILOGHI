import Decimal from "decimal.js";

/**
 * Tỷ giá quy đổi tiền tệ nội bộ cố định chuẩn hóa về VND.
 * Nguồn tham chiếu chuẩn duy nhất toàn hệ thống THILOGI ERP.
 */
export const STANDARD_FX_RATES: Record<string, number> = {
  VND: 1.0,
  USD: 25450.0,
  LAK: 1.18,
  KHR: 6.25,
};

export const STANDARD_USD_FX_RATE = STANDARD_FX_RATES.USD; // 25450.0

export class UnsupportedCurrencyError extends Error {
  constructor(currency: string) {
    super(`Loại tiền tệ [${currency}] chưa được cấu hình tỷ giá quy đổi sang VND. Vui lòng kiểm tra bảng tỷ giá.`);
    this.name = "UnsupportedCurrencyError";
  }
}

export function getFxRateToVnd(currency: string): number {
  const code = (currency || "").trim().toUpperCase();
  const rate = STANDARD_FX_RATES[code];
  if (rate === undefined) {
    throw new UnsupportedCurrencyError(currency);
  }
  return rate;
}

export function convertCurrencyToVnd(amount: Decimal.Value, currency: string): number {
  const fx = getFxRateToVnd(currency);
  return roundVnd(new Decimal(amount).mul(fx)).toNumber();
}

/** Ngày nghiệp vụ theo giờ Việt Nam, độc lập múi giờ trình duyệt/VPS. */
export function getBusinessDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

/** Làm tròn đơn giá và thành tiền VND đến đồng, quy tắc HALF_UP. */
export function roundVnd(value: Decimal.Value): Decimal {
  return new Decimal(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
}

export function calculateQuotationFinancials(items: {
  plannedQuantity: number; unitSellPrice: number; unitBuyPrice: number; worstCaseBuyPrice: number;
}[]) {
  let sell = new Decimal(0);
  let buy = new Decimal(0);
  let worst = new Decimal(0);
  for (const item of items) {
    sell = sell.add(roundVnd(roundVnd(item.unitSellPrice).mul(item.plannedQuantity)));
    buy = buy.add(roundVnd(roundVnd(item.unitBuyPrice).mul(item.plannedQuantity)));
    worst = worst.add(roundVnd(roundVnd(item.worstCaseBuyPrice).mul(item.plannedQuantity)));
  }
  const gp = sell.sub(buy);
  return {
    totalSellAmount: sell.toNumber(), totalEstimatedBuy: buy.toNumber(), totalWorstCaseBuy: worst.toNumber(),
    estimatedGp: gp.toNumber(), estimatedMarginPercent: sell.isZero() ? 0 : gp.div(sell).mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
  };
}

export type CostComponentBreakdown = {
  servicePackage: string;
  totalSell: number;
  totalBuy: number;
  totalWorstCaseBuy: number;
  gp: number;
  marginPercent: number;
  itemCount: number;
};

/**
 * Phân tích cấu trúc chi phí (Cost Composition) theo từng nhóm dịch vụ bắt buộc.
 * Giúp Pricing và Manager kiểm soát Worst-case BUY tổng hợp = SUM(Worst-case BUY từng nhóm).
 */
export function summarizeCostComponents(items: {
  servicePackage?: string;
  plannedQuantity: number;
  unitSellPrice: number;
  unitBuyPrice: number;
  worstCaseBuyPrice: number;
  pricingInclusion?: string;
}[]): {
  groups: Record<string, CostComponentBreakdown>;
  totals: ReturnType<typeof calculateQuotationFinancials>;
} {
  const groups: Record<string, CostComponentBreakdown> = {};
  for (const item of items) {
    const pkg = item.servicePackage || "TRUCKING";
    if (!groups[pkg]) {
      groups[pkg] = {
        servicePackage: pkg,
        totalSell: 0,
        totalBuy: 0,
        totalWorstCaseBuy: 0,
        gp: 0,
        marginPercent: 0,
        itemCount: 0,
      };
    }
    const qty = item.plannedQuantity || 1;
    const sell = roundVnd(roundVnd(item.unitSellPrice).mul(qty)).toNumber();
    const buy = roundVnd(roundVnd(item.unitBuyPrice).mul(qty)).toNumber();
    const worst = roundVnd(roundVnd(item.worstCaseBuyPrice).mul(qty)).toNumber();

    groups[pkg].totalSell += sell;
    groups[pkg].totalBuy += buy;
    groups[pkg].totalWorstCaseBuy += worst;
    groups[pkg].gp = groups[pkg].totalSell - groups[pkg].totalBuy;
    groups[pkg].marginPercent = groups[pkg].totalSell > 0
      ? Number(new Decimal(groups[pkg].gp).div(groups[pkg].totalSell).mul(100).toFixed(2))
      : 0;
    groups[pkg].itemCount += 1;
  }
  const totals = calculateQuotationFinancials(items);
  return { groups, totals };
}

/**
 * Chuyển đổi số tiền VND thành chữ tiếng Việt chuẩn hóa cho biểu mẫu Hợp đồng / Báo giá logistics.
 */
export function numberToVietnameseWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return "Không đồng";

  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const scales = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

  function readThreeDigits(n: number, isHighest: boolean): string {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    const parts: string[] = [];

    if (h > 0 || !isHighest) {
      parts.push(digits[h] + " trăm");
    }

    if (t > 1) {
      parts.push(digits[t] + " mươi");
      if (u === 1) parts.push("mốt");
      else if (u === 4) parts.push("tư");
      else if (u === 5) parts.push("lăm");
      else if (u > 0) parts.push(digits[u]);
    } else if (t === 1) {
      parts.push("mười");
      if (u === 5) parts.push("lăm");
      else if (u > 0) parts.push(digits[u]);
    } else {
      if (h > 0 && u > 0) parts.push("lẻ");
      if (u > 0) parts.push(digits[u]);
    }

    return parts.join(" ");
  }

  let num = Math.floor(Math.abs(amount));
  if (num === 0) return "Không đồng";

  const chunks: number[] = [];
  while (num > 0) {
    chunks.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  const parts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk > 0) {
      const text = readThreeDigits(chunk, i === chunks.length - 1);
      if (text) {
        parts.push(text);
        if (scales[i]) parts.push(scales[i]);
      }
    }
  }

  const result = parts.join(" ").trim() + " đồng chẵn";
  return result.charAt(0).toUpperCase() + result.slice(1);
}
