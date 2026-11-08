"use server";

import {
  getRoadRatesDetailedList,
  saveRoadRateService,
  toggleRoadRateStatusService,
  deleteRoadRateService,
  type SaveRoadRateInput,
  getMasterLocations,
  getMasterVendors,
  getCustomersDetailedList,
  getVendorsDetailedList,
  getLocationsDetailedList,
  saveLocationService,
  toggleLocationStatusService,
  deleteLocationService,
  type SaveLocationInput,
  getCommoditiesDetailedList,
  saveCommodityService,
  toggleCommodityStatusService,
  deleteCommodityService,
  type SaveCommodityInput,
  getFleetDetailedList,
  type TractorFleetItem,
  type TrailerFleetItem,
  type DriverFleetItem,
  saveTractorService,
  deleteTractorService,
  type SaveTractorInput,
  saveTrailerService,
  deleteTrailerService,
  type SaveTrailerInput,
  saveDriverService,
  deleteDriverService,
  type SaveDriverInput,
  getFleetVendorsService,
  getMasterRegions,
  getMasterServicesList,
  saveServicePackage,
  toggleServiceStatus,
  type MasterServicePackage,
  type SaveServicePackageInput,
} from "@/server/modules/master-data/master-data.service";
import {
  getPortRatesDetailedList,
  savePortRateService,
  togglePortRateStatusService,
  deletePortRateService,
  lookupPortRates,
  type PortRateItem,
  type SavePortRateInput,
  type PortRateLookupQuery,
} from "@/server/modules/supplier-pricing/port-rates.service";
import {
  getBorderRatesDetailedList,
  saveBorderRateService,
  toggleBorderRateStatusService,
  deleteBorderRateService,
  lookupBorderRates,
  type BorderRateItem,
  type SaveBorderRateInput,
  type BorderRateLookupQuery,
} from "@/server/modules/supplier-pricing/border-rates.service";
import {
  getOceanRatesDetailedList,
  saveOceanRateService,
  toggleOceanRateStatusService,
  deleteOceanRateService,
  lookupOceanRates,
  getOceanCarriersList,
  getOceanPortsList,
  type OceanRateItem,
  type SaveOceanRateInput,
  type OceanRateLookupQuery,
} from "@/server/modules/supplier-pricing/ocean-rates.service";

export type {
  PortRateItem,
  SavePortRateInput,
  PortRateLookupQuery,
  BorderRateItem,
  SaveBorderRateInput,
  BorderRateLookupQuery,
  OceanRateItem,
  SaveOceanRateInput,
  OceanRateLookupQuery,
  PortDepotPartnerOption,
};

export type {
  MasterServicePackage,
  SaveServicePackageInput,
};

export type {
  TractorFleetItem,
  TrailerFleetItem,
  DriverFleetItem,
  SaveTractorInput,
  SaveTrailerInput,
  SaveDriverInput,
};

export async function getRoadRatesAction(search?: string) {
  try {
    await requireAuth();
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

export async function getRoadRateOptionsAction() {
  try {
    await requireAuth();
    const [locations, vendors] = await Promise.all([
      getMasterLocations(),
      getMasterVendors(),
    ]);
    return { success: true, locations, vendors };
  } catch (err) {
    return {
      success: false,
      locations: [],
      vendors: [],
      error: err instanceof Error ? err.message : "Lỗi khi tải danh mục phụ trợ",
    };
  }
}

export async function saveRoadRateAction(input: SaveRoadRateInput) {
  try {
    const actor = await requireAuth();
    const res = await saveRoadRateService(input, actor);
    return { success: true as const, data: res.data, message: res.message };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Lỗi khi lưu biểu cước",
    };
  }
}

export async function toggleRoadRateStatusAction(rateId: string) {
  try {
    const actor = await requireAuth();
    const res = await toggleRoadRateStatusService(rateId, actor);
    return { success: true as const, status: res.status, message: res.message };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Lỗi khi đổi trạng thái biểu cước",
    };
  }
}

export async function deleteRoadRateAction(rateId: string) {
  try {
    const actor = await requireAuth();
    const res = await deleteRoadRateService(rateId, actor);
    return { success: true as const, message: res.message };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Lỗi khi xóa biểu cước",
    };
  }
}

export async function getCustomersAndVendorsAction(search?: string) {
  try {
    await requireAuth();
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
    await requireAuth();
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

export async function saveLocationAction(input: SaveLocationInput) {
  try {
    const actor = await requireAuth();
    const result = await saveLocationService(input, actor);
    return { success: true, message: result.message, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi lưu thông tin địa điểm",
    };
  }
}

export async function toggleLocationStatusAction(locationId: string) {
  try {
    const actor = await requireAuth();
    const result = await toggleLocationStatusService(locationId, actor);
    return { success: true, isActive: result.isActive, message: result.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi đổi trạng thái địa điểm",
    };
  }
}

export async function deleteLocationAction(locationId: string) {
  try {
    const actor = await requireAuth();
    const result = await deleteLocationService(locationId, actor);
    return { success: true, message: result.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi xóa địa điểm",
    };
  }
}

export async function getCommoditiesAction(search?: string) {
  try {
    await requireAuth();
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

export async function saveCommodityAction(input: SaveCommodityInput) {
  try {
    const actor = await requireAuth();
    const result = await saveCommodityService(input, actor);
    return { success: true, message: result.message, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi lưu mặt hàng",
    };
  }
}

export async function toggleCommodityStatusAction(commodityId: string) {
  try {
    const actor = await requireAuth();
    const result = await toggleCommodityStatusService(commodityId, actor);
    return { success: true, message: result.message, status: result.status };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi đổi trạng thái",
    };
  }
}

export async function deleteCommodityAction(commodityId: string) {
  try {
    const actor = await requireAuth();
    const result = await deleteCommodityService(commodityId, actor);
    return { success: true, message: result.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi xóa mặt hàng",
    };
  }
}

export async function getFleetAction(limit?: number) {
  try {
    await requireAuth();
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

export async function saveTractorAction(input: SaveTractorInput) {
  try {
    const actor = await requireAuth();
    const res = await saveTractorService(input, actor);
    return { success: true, message: res.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi lưu đầu kéo",
    };
  }
}

export async function deleteTractorAction(tractorNo: string) {
  try {
    const actor = await requireAuth();
    const res = await deleteTractorService(tractorNo, actor);
    return { success: true, message: res.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi xóa đầu kéo",
    };
  }
}

export async function saveTrailerAction(input: SaveTrailerInput) {
  try {
    const actor = await requireAuth();
    const res = await saveTrailerService(input, actor);
    return { success: true, message: res.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi lưu rơ-moóc",
    };
  }
}

export async function deleteTrailerAction(trailerNo: string) {
  try {
    const actor = await requireAuth();
    const res = await deleteTrailerService(trailerNo, actor);
    return { success: true, message: res.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi xóa rơ-moóc",
    };
  }
}

export async function saveDriverAction(input: SaveDriverInput) {
  try {
    const actor = await requireAuth();
    const res = await saveDriverService(input, actor);
    return { success: true, message: res.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi lưu tài xế",
    };
  }
}

export async function deleteDriverAction(driverId: string) {
  try {
    const actor = await requireAuth();
    const res = await deleteDriverService(driverId, actor);
    return { success: true, message: res.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi xóa tài xế",
    };
  }
}

export async function getFleetVendorsAction() {
  try {
    await requireAuth();
    const vendors = await getFleetVendorsService();
    return { success: true, vendors };
  } catch (err) {
    return {
      success: false,
      vendors: [],
      error: err instanceof Error ? err.message : "Lỗi khi tải danh sách nhà xe",
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
  savePartner,
  getPortDepotPartnersList,
  type SavePartnerInput,
  type PortDepotPartnerOption,
} from "@/server/modules/master-data/partner-lifecycle.service";
import { requireAuth, requireRole } from "@/server/auth/authorize";

export async function getPartnersDirectoryAction(filters?: {
  search?: string;
  roleFilter?: "ALL" | "CUSTOMER" | "VENDOR" | "NO_ROLE";
  status?: string;
  limit?: number;
}) {
  try {
    await requireAuth();
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

export async function getPortDepotPartnersAction() {
  try {
    await requireAuth();
    const data = await getPortDepotPartnersList();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Lỗi khi tải danh mục đối tác Cảng/Depot",
    };
  }
}

export async function activateCustomerRoleAction(input: {
  partnerId: string;
  paymentTermsDays?: number;
  creditLimitVnd?: number | null;
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
  creditLimitVnd?: number | null;
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
    await requireAuth();
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

export async function savePartnerAction(input: SavePartnerInput) {
  try {
    const actor = await requireAuth();
    const result = await savePartner(input, actor);
    return { success: true, message: result.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi lưu thông tin đối tác",
    };
  }
}

export async function bulkImportRoadRatesAction(rows: Array<{
  vendorId: string;
  pickupLocationId: string;
  deliveryLocationId: string;
  equipmentType: string;
  buyRate: number;
  currency: string;
  validFrom: string;
  validTo: string;
  remarks?: string;
}>) {
  try {
    const actor = await requireAuth();
    requireRole(actor, ["PRICING_SPECIALIST", "PRICING_MANAGER", "ADMIN", "DIRECTOR"]);

    if (!rows.length) {
      return { success: false, error: "Danh sách bảng giá rỗng." };
    }
    if (rows.length > 500) {
      return { success: false, error: "Số lượng dòng tối đa mỗi lần import là 500 bản ghi." };
    }

    const { pool } = await import("@/server/db");
    const { randomUUID } = await import("node:crypto");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let count = 0;

      for (const row of rows) {
        // Validate vendor is active
        const vendorCheck = await client.query(
          "SELECT v.vendor_id FROM vendors v JOIN partners p ON p.partner_id=v.vendor_id WHERE v.vendor_id=$1 AND v.role_status='ACTIVE' AND p.status='ACTIVE'",
          [row.vendorId]
        );
        if (!vendorCheck.rows.length) {
          throw new Error(`Nhà cung cấp [${row.vendorId}] chưa được kích hoạt hoặc không tồn tại.`);
        }

        // Validate locations
        const locCheck = await client.query(
          "SELECT location_id, is_active FROM locations WHERE location_id=ANY($1::varchar[])",
          [[row.pickupLocationId, row.deliveryLocationId]]
        );
        if (locCheck.rows.length < 2 || !locCheck.rows.every((r: { is_active: boolean }) => r.is_active)) {
          throw new Error(`Điểm đi [${row.pickupLocationId}] hoặc điểm đến [${row.deliveryLocationId}] không hợp lệ hoặc đang ngừng hoạt động.`);
        }

        const rateId = randomUUID();
        const insertQuery = `
          INSERT INTO road_rates (rate_id, vendor_id, pickup_location_id, delivery_location_id, equipment_type, buy_rate, currency, validity_range, status, remarks)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::daterange, 'DRAFT', $9)
          RETURNING *;
        `;
        const res = await client.query(insertQuery, [
          rateId,
          row.vendorId,
          row.pickupLocationId,
          row.deliveryLocationId,
          row.equipmentType,
          row.buyRate,
          row.currency,
          `[${row.validFrom},${row.validTo})`,
          row.remarks ?? null,
        ]);

        await client.query(
          "INSERT INTO master_data_audit(entity_type, entity_id, action, actor_id, actor_name, before_data, after_data, comment) VALUES($1, $2, 'SAVE', $3, $4, null, $5, $6)",
          ["rates", rateId, actor.userId, actor.fullName, JSON.stringify(res.rows[0]), "Import hàng loạt từ Excel"]
        );
        count++;
      }

      await client.query("COMMIT");
      return { success: true, count, message: `Đã nhập thành công ${count} bảng giá mua (trạng thái DRAFT).` };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi import bảng giá",
    };
  }
}

export async function getMasterServicesAction(filters?: {
  search?: string;
  category?: string;
  status?: string;
}) {
  try {
    await requireAuth();
    const data = await getMasterServicesList(filters);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Lỗi tải danh mục dịch vụ",
    };
  }
}

export async function saveServicePackageAction(input: SaveServicePackageInput) {
  try {
    const actor = await requireAuth();
    const res = await saveServicePackage(input, actor);
    return { success: true, data: res, message: `Đã lưu gói dịch vụ [${res.serviceName}] thành công.` };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi lưu gói dịch vụ",
    };
  }
}

export async function toggleServiceStatusAction(serviceId: string, isActive: boolean) {
  try {
    const actor = await requireAuth();
    await toggleServiceStatus(serviceId, isActive, actor);
    return {
      success: true,
      message: `Đã ${isActive ? "kích hoạt" : "tạm dừng"} gói dịch vụ [${serviceId}] thành công.`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi cập nhật trạng thái gói dịch vụ",
    };
  }
}

export async function getPortRatesAction(filters?: {
  search?: string;
  portCode?: string;
  chargeCode?: string;
  containerType?: string;
  status?: string;
}) {
  try {
    await requireAuth();
    const data = await getPortRatesDetailedList(filters);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Lỗi tải biểu phí cảng",
    };
  }
}

export async function savePortRateAction(input: SavePortRateInput) {
  try {
    const actor = await requireAuth();
    const res = await savePortRateService(input, actor);
    return {
      success: true,
      data: res,
      message: `Đã lưu biểu phí [${res.chargeCode} - ${res.containerType}] thành công.`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi lưu biểu phí cảng",
    };
  }
}

export async function togglePortRateStatusAction(rateId: string, status: string) {
  try {
    const actor = await requireAuth();
    await togglePortRateStatusService(rateId, status, actor);
    return {
      success: true,
      message: `Đã đổi trạng thái sang [${status}] thành công.`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi cập nhật trạng thái biểu phí cảng",
    };
  }
}

export async function deletePortRateAction(rateId: string) {
  try {
    const actor = await requireAuth();
    await deletePortRateService(rateId, actor);
    return {
      success: true,
      message: "Đã xóa biểu phí cảng thành công.",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi xóa biểu phí cảng",
    };
  }
}

export async function lookupPortRatesAction(query: PortRateLookupQuery) {
  try {
    await requireAuth();
    const res = await lookupPortRates(query);
    return { success: true, ...res };
  } catch (err) {
    return {
      success: false,
      status: "MISSING_RATE" as const,
      message: err instanceof Error ? err.message : "Lỗi tra cứu biểu phí cảng",
      candidates: [],
    };
  }
}

export async function getBorderRatesAction(filters?: {
  search?: string;
  borderPairId?: string;
  countryPair?: string;
  status?: string;
}) {
  try {
    await requireAuth();
    const data = await getBorderRatesDetailedList(filters);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Lỗi tải biểu phí cửa khẩu",
    };
  }
}

export async function saveBorderRateAction(input: SaveBorderRateInput) {
  try {
    const actor = await requireAuth();
    const res = await saveBorderRateService(input, actor);
    return {
      success: true,
      data: res,
      message: `Đã lưu biểu phí cửa khẩu [${res.borderPairName} - ${res.commodityName}] thành công.`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi lưu biểu phí cửa khẩu",
    };
  }
}

export async function toggleBorderRateStatusAction(rateId: string, status: string) {
  try {
    const actor = await requireAuth();
    await toggleBorderRateStatusService(rateId, status, actor);
    return {
      success: true,
      message: `Đã đổi trạng thái sang [${status}] thành công.`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi cập nhật trạng thái biểu phí cửa khẩu",
    };
  }
}

export async function deleteBorderRateAction(rateId: string) {
  try {
    const actor = await requireAuth();
    await deleteBorderRateService(rateId, actor);
    return {
      success: true,
      message: "Đã xóa biểu phí cửa khẩu thành công.",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi xóa biểu phí cửa khẩu",
    };
  }
}

export async function lookupBorderRatesAction(query: BorderRateLookupQuery) {
  try {
    await requireAuth();
    const res = await lookupBorderRates(query);
    return { success: true, ...res };
  } catch (err) {
    return {
      success: false,
      status: "MISSING_RATE" as const,
      message: err instanceof Error ? err.message : "Lỗi tra cứu biểu phí cửa khẩu",
      candidates: [],
    };
  }
}

export async function getOceanCarriersAction() {
  try {
    await requireAuth();
    const data = await getOceanCarriersList();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Lỗi tải danh mục hãng tàu",
    };
  }
}

export async function getOceanPortsAction() {
  try {
    await requireAuth();
    const data = await getOceanPortsList();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Lỗi tải danh mục cảng biển",
    };
  }
}

export async function getOceanRatesAction(filters?: {
  search?: string;
  carrierId?: string;
  polId?: string;
  podId?: string;
  containerType?: string;
  status?: string;
}) {
  try {
    await requireAuth();
    const data = await getOceanRatesDetailedList(filters);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Lỗi tải biểu cước vận tải biển",
    };
  }
}

export async function saveOceanRateAction(input: SaveOceanRateInput) {
  try {
    const actor = await requireAuth();
    const res = await saveOceanRateService(input, actor);
    return {
      success: true,
      data: res,
      message: `Đã lưu biểu cước vận tải biển [${res.carrierName}: ${res.polName} -> ${res.podName}] thành công.`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi lưu biểu cước vận tải biển",
    };
  }
}

export async function toggleOceanRateStatusAction(rateId: string, status: string) {
  try {
    const actor = await requireAuth();
    await toggleOceanRateStatusService(rateId, status, actor);
    return {
      success: true,
      message: `Đã đổi trạng thái sang [${status}] thành công.`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi cập nhật trạng thái biểu cước vận tải biển",
    };
  }
}

export async function deleteOceanRateAction(rateId: string) {
  try {
    const actor = await requireAuth();
    await deleteOceanRateService(rateId, actor);
    return {
      success: true,
      message: "Đã xóa biểu cước vận tải biển thành công.",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi xóa biểu cước vận tải biển",
    };
  }
}

export async function lookupOceanRatesAction(query: OceanRateLookupQuery) {
  try {
    await requireAuth();
    const res = await lookupOceanRates(query);
    return { success: true, ...res };
  } catch (err) {
    return {
      success: false,
      status: "MISSING_RATE" as const,
      message: err instanceof Error ? err.message : "Lỗi tra cứu biểu cước vận tải biển",
      candidates: [],
    };
  }
}
