"use server";

import {
  getMasterCustomers,
  getMasterRegions,
  getMasterLocations,
  getMasterCommodities,
  EQUIPMENT_TYPES,
} from "@/server/modules/master-data/master-data.service";
import {
  lookupRoadRates,
  RateLookupQuery,
  RateLookupResult,
} from "@/server/modules/supplier-pricing/rate-lookup.service";
import {
  saveQuotationDraft,
  submitQuotationForApproval,
} from "@/server/modules/quotation/quotation.service";
import { CreateQuotationInput } from "@/shared/schemas/quotation.schema";

export async function getQuotationMasterDataAction() {
  const [customers, regions, locations, commodities] = await Promise.all([
    getMasterCustomers(),
    getMasterRegions(),
    getMasterLocations(),
    getMasterCommodities(),
  ]);

  return {
    customers,
    regions,
    locations,
    commodities,
    equipmentTypes: EQUIPMENT_TYPES,
  };
}

export async function lookupRoadRatesAction(
  query: RateLookupQuery
): Promise<RateLookupResult> {
  try {
    return await lookupRoadRates(query);
  } catch (error) {
    return {
      status: "MISSING_RATE",
      candidates: [],
      message: error instanceof Error ? error.message : "Lỗi kết nối cơ sở dữ liệu khi tra cứu bảng giá",
    };
  }
}

export async function saveDraftQuotationAction(input: CreateQuotationInput) {
  try {
    const res = await saveQuotationDraft(input);
    return { success: true, data: res };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi khi lưu báo giá nháp",
    };
  }
}

export async function submitQuotationAction(quotationId: string) {
  try {
    const res = await submitQuotationForApproval(quotationId);
    return res;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi khi trình duyệt báo giá",
    };
  }
}
