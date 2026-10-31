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
  approveQuotation,
  rejectQuotation,
  returnQuotationToDraft,
  getQuotationsList,
  getQuotationDetail,
} from "@/server/modules/quotation/quotation.service";
import { z } from "zod";
import { getBusinessDate } from "@/shared/utils/pricing";
import { CreateQuotationInput, createQuotationSchema, quotationListFilterSchema, rateLookupSchema } from "@/shared/schemas/quotation.schema";
import { requireAuth, requireRegionScope } from "@/server/auth/authorize";
import { getSessionActor, switchSessionUser, isDemoAuthEnabled } from "@/server/auth/session";
import { getActiveUsersList } from "@/server/auth/users";

export async function getQuotationRegionsAction() {
  try {
    const actor = await requireAuth();
    const regions = await getMasterRegions();
    return { success: true, data: regions.filter(region => actor.regionScopes.includes("*") || actor.regionScopes.includes(region.id)) };
  } catch {
    return { success: false, data: [] };
  }
}

export async function getQuotationMasterDataAction() {
  try {
    const actor = await requireAuth();
    const [customers, regions, locations, commodities] = await Promise.all([
      getMasterCustomers(),
      getMasterRegions(),
      getMasterLocations(),
      getMasterCommodities(),
    ]);

    return {
      success: true,
      customers,
      regions: regions.filter((region) => actor.regionScopes.includes("*") || actor.regionScopes.includes(region.id)),
      locations,
      commodities,
      equipmentTypes: EQUIPMENT_TYPES,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      customers: [],
      regions: [],
      locations: [],
      commodities: [],
      equipmentTypes: EQUIPMENT_TYPES,
      error: error instanceof Error ? error.message : "Lỗi kết nối cơ sở dữ liệu khi tải danh mục",
    };
  }
}

export async function lookupRoadRatesAction(
  query: RateLookupQuery
): Promise<RateLookupResult> {
  try {
    await requireAuth();
    return await lookupRoadRates(rateLookupSchema.parse({ ...query, pricingDate: getBusinessDate() }));
  } catch (error) {
    return {
      status: "ERROR",
      candidates: [],
      message: error instanceof Error ? error.message : "Lỗi kết nối cơ sở dữ liệu khi tra cứu bảng giá",
    };
  }
}

/**
 * Lưu Báo giá Nháp có ràng buộc Authentication & Region Scope (P0.2)
 */
export async function saveDraftQuotationAction(rawInput: CreateQuotationInput, submit = false) {
  try {
    // 1. Xác thực danh tính người dùng thực
    const actor = await requireAuth();

    const input = createQuotationSchema.parse(rawInput);
    z.boolean().parse(submit);

    // 2. Kiểm tra Region Scope: Người dùng có quyền trên Phân vùng được chọn không?
    requireRegionScope(actor, input.regionId);

    // 3. Thực thi lưu trữ với createdBy lấy từ session an toàn, không lấy từ client
    const res = await saveQuotationDraft(input, actor, submit);
    return { success: true, data: res };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi khi lưu báo giá nháp",
    };
  }
}

/**
 * Phê duyệt Báo giá (PR-05 Approval Matrix)
 */
export async function approveQuotationAction(quotationId: string, comment?: string) {
  try {
    const actor = await requireAuth();
    z.string().uuid().parse(quotationId);
    z.string().trim().max(2000).optional().parse(comment);
    const res = await approveQuotation(quotationId, actor, comment);
    return res;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi khi phê duyệt báo giá",
    };
  }
}

/**
 * Từ chối Báo giá (PR-05)
 */
export async function rejectQuotationAction(quotationId: string, comment: string) {
  try {
    const actor = await requireAuth();
    z.string().uuid().parse(quotationId);
    z.string().trim().min(1).max(2000).parse(comment);
    const res = await rejectQuotation(quotationId, actor, comment);
    return res;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi khi từ chối báo giá",
    };
  }
}

/**
 * Trả về Bản Nháp để chỉnh sửa (PR-05)
 */
export async function returnQuotationToDraftAction(quotationId: string, comment: string) {
  try {
    const actor = await requireAuth();
    z.string().uuid().parse(quotationId);
    z.string().trim().min(1).max(2000).parse(comment);
    const res = await returnQuotationToDraft(quotationId, actor, comment);
    return res;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi khi trả báo giá về bản nháp",
    };
  }
}

/**
 * Lấy thông tin tài khoản đang đăng nhập trong phiên
 */
export async function getCurrentUserAction() {
  const session = await getSessionActor();
  return session ? await requireAuth() : null;
}

/**
 * Lấy danh sách các tài khoản người dùng thực tế từ PostgreSQL
 */
export async function getAvailableUsersAction() {
  if (!isDemoAuthEnabled()) return [];
  return await getActiveUsersList();
}

/**
 * Chuyển đổi tài khoản người dùng trong phiên làm việc
 */
export async function switchUserAction(userId: string) {
  const actor = await switchSessionUser(userId);
  return { success: true, actor };
}

/**
 * Lấy danh sách Báo giá từ PostgreSQL (phục vụ Quotation List & Approval Worklist)
 */
export async function getQuotationsListAction(filters?: {
  status?: string;
  regionId?: string;
  search?: string;
  limit?: number;
}) {
  try {
    const list = await getQuotationsList(await requireAuth(), quotationListFilterSchema.parse(filters ?? {}));
    return { success: true, data: list, error: null };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Lỗi khi tải danh sách báo giá",
    };
  }
}

/**
 * Lấy chi tiết Báo giá kèm các dòng dịch vụ (phục vụ xem chi tiết và in Báo giá thương mại)
 */
export async function getQuotationDetailAction(quotationId: string) {
  try {
    const detail = await getQuotationDetail(z.string().uuid().parse(quotationId), await requireAuth());
    if (!detail) {
      return { success: false, data: null, error: "Không tìm thấy báo giá yêu cầu" };
    }
    return { success: true, data: detail, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Lỗi khi tải chi tiết báo giá",
    };
  }
}
