import type { ServiceItemState } from "./editor-state";
import { getBusinessDate } from "@/shared/utils/pricing";

export function emptyServiceItem(id: string): ServiceItemState {
  return { id, servicePackage: "TRUCKING", pricingInclusion: "INCLUDED", originLocationId: "", destinationLocationId: "", equipmentType: "", plannedQuantity: 1, unit: "TRIP", unitBuyPrice: 0, worstCaseBuyPrice: 0, unitSellPrice: 0 };
}
export function rateWarning(item: ServiceItemState, date = getBusinessDate()): string | null {
  if (!item.selectedBuyRateId) return "Chưa chọn giá mua";
  if (!item.selectedCandidate) return "Cần tra lại giá mua";
  if (item.selectedCandidate.validityStart > date || item.selectedCandidate.validityEnd <= date) return "Giá mua ngoài hiệu lực; cần tra lại";
  return null;
}
export function commercialFingerprint(header: {customerId: string; regionId: string; commodityId: string; paymentTermsDays: number}, items: ServiceItemState[]) {
  return JSON.stringify({ ...header, items: items.map(i => ({ servicePackage: i.servicePackage, pricingInclusion: i.pricingInclusion, originLocationId: i.originLocationId, destinationLocationId: i.destinationLocationId, equipmentType: i.equipmentType, plannedQuantity: i.plannedQuantity, unit: i.unit, unitSellPrice: i.unitSellPrice, selectedBuyRateId: i.selectedBuyRateId ?? "" })) });
}
