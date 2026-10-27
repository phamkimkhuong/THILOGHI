"use server";

import {
  getRoadRatesDetailedList,
  getCustomersDetailedList,
  getVendorsDetailedList,
  getLocationsDetailedList,
  getCommoditiesDetailedList,
  getFleetDetailedList,
  getMasterRegions,
} from "@/server/modules/master-data/master-data.service";

export async function getRoadRatesAction(search?: string) {
  try {
    const list = await getRoadRatesDetailedList({ search });
    return { success: true, data: list };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Lỗi khi tải bảng giá cước",
    };
  }
}

export async function getCustomersAndVendorsAction(search?: string) {
  try {
    const [customers, vendors] = await Promise.all([
      getCustomersDetailedList({ search }),
      getVendorsDetailedList({ search }),
    ]);
    return { success: true, customers, vendors };
  } catch (err) {
    return {
      success: false,
      customers: [],
      vendors: [],
      error: err instanceof Error ? err.message : "Lỗi khi tải danh mục khách hàng",
    };
  }
}

export async function getLocationsAction(search?: string, regionId?: string) {
  try {
    const [locations, regions] = await Promise.all([
      getLocationsDetailedList({ search, regionId }),
      getMasterRegions(),
    ]);
    return { success: true, locations, regions };
  } catch (err) {
    return {
      success: false,
      locations: [],
      regions: [],
      error: err instanceof Error ? err.message : "Lỗi khi tải địa điểm",
    };
  }
}

export async function getCommoditiesAction(search?: string) {
  try {
    const list = await getCommoditiesDetailedList({ search });
    return { success: true, data: list };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Lỗi khi tải danh mục mặt hàng",
    };
  }
}

export async function getFleetAction(limit?: number) {
  try {
    const fleet = await getFleetDetailedList(limit);
    return { success: true, fleet };
  } catch (err) {
    return {
      success: false,
      fleet: { tractors: [], trailers: [], drivers: [] },
      error: err instanceof Error ? err.message : "Lỗi khi tải danh mục đội xe",
    };
  }
}

// --------------------------------------------------------------------
// Customer Role Lifecycle & Authorization Server Actions
// --------------------------------------------------------------------
import {
  getPartnersDirectory,
  activateCustomerRole,
  suspendCustomerRole,
  requestCustomerRoleActivation,
  updateCustomerRoleTerms,
  getPartnerRoleAuditHistory,
} from "@/server/modules/master-data/partner-lifecycle.service";
import { requireAuth } from "@/server/auth/authorize";

export async function getPartnersDirectoryAction(filters?: {
  search?: string;
  roleFilter?: "ALL" | "CUSTOMER" | "VENDOR" | "NO_ROLE";
  status?: string;
  limit?: number;
}) {
  try {
    const data = await getPartnersDirectory(filters);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Lỗi khi tải danh mục đối tác",
    };
  }
}

export async function activateCustomerRoleAction(input: {
  partnerId: string;
  paymentTermsDays?: number;
  creditLimitVnd?: number;
  comment?: string;
}) {
  try {
    const actor = await requireAuth();
    const result = await activateCustomerRole(input, actor);
    return { success: true, message: result.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi kích hoạt vai trò Khách hàng",
    };
  }
}

export async function suspendCustomerRoleAction(input: {
  partnerId: string;
  reason: string;
}) {
  try {
    const actor = await requireAuth();
    const result = await suspendCustomerRole(input, actor);
    return { success: true, message: result.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi tạm ngừng vai trò Khách hàng",
    };
  }
}

export async function requestCustomerRoleActivationAction(partnerId: string) {
  try {
    const actor = await requireAuth();
    const result = await requestCustomerRoleActivation(partnerId, actor);
    return { success: true, message: result.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi gửi đề nghị kích hoạt vai trò Khách hàng",
    };
  }
}

export async function updateCustomerRoleTermsAction(input: {
  partnerId: string;
  paymentTermsDays: number;
  creditLimitVnd?: number;
}) {
  try {
    const actor = await requireAuth();
    const result = await updateCustomerRoleTerms(input, actor);
    return { success: true, message: result.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi cập nhật hạn mức tín dụng",
    };
  }
}

export async function getPartnerRoleAuditHistoryAction(partnerId: string) {
  try {
    const data = await getPartnerRoleAuditHistory(partnerId);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Lỗi khi tải lịch sử audit vai trò",
    };
  }
}
