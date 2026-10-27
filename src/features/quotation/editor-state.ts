import type { RateCandidate, RateLookupResult } from "@/server/modules/supplier-pricing/rate-lookup.service";
import type { QuotationDetailResponse } from "@/server/modules/quotation/quotation.service";
import type { QuotationServiceItemInput } from "@/shared/schemas/quotation.schema";

export interface ServiceItemState {
  id: string;
  servicePackage: string;
  pricingInclusion: QuotationServiceItemInput["pricingInclusion"];
  originLocationId: string;
  destinationLocationId: string;
  equipmentType: string;
  plannedQuantity: number;
  unit: string;
  selectedBuyRateId?: string;
  lookupResult?: RateLookupResult;
  selectedCandidate?: RateCandidate;
  unitBuyPrice: number;
  worstCaseBuyPrice: number;
  unitSellPrice: number;
}

export function restoreQuotationItems(detail: QuotationDetailResponse): ServiceItemState[] {
  return detail.items.map((item) => {
    const snapshot = detail.snapshots.find((entry) => entry.itemId === item.itemId);
    const unitBuyPrice = item.plannedQuantity > 0 ? item.estimatedBuyAmount / item.plannedQuantity : 0;
    return {
      id: item.itemId, servicePackage: item.servicePackage,
      pricingInclusion: item.pricingInclusion as QuotationServiceItemInput["pricingInclusion"],
      originLocationId: item.originLocationId, destinationLocationId: item.destinationLocationId,
      equipmentType: item.equipmentType, plannedQuantity: item.plannedQuantity, unit: item.unit,
      unitSellPrice: item.unitSellPrice, unitBuyPrice,
      worstCaseBuyPrice: item.plannedQuantity > 0 ? item.worstCaseBuyAmount / item.plannedQuantity : 0,
      selectedBuyRateId: item.selectedBuyRateId,
      selectedCandidate: snapshot && item.selectedBuyRateId ? {
        rateId: item.selectedBuyRateId, vendorId: snapshot.vendorId, vendorName: snapshot.vendorName,
        buyRate: snapshot.rateAmount, currency: snapshot.originalCurrency,
        fxRateToVnd: snapshot.fxRateToVnd, buyRateVnd: unitBuyPrice,
        validityRange: `[${snapshot.validityStart},${snapshot.validityEnd})`,
        validityStart: snapshot.validityStart, validityEnd: snapshot.validityEnd,
      } : undefined,
    };
  });
}
