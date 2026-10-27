import Decimal from "decimal.js";

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
