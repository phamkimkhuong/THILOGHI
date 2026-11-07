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
  getMasterRegions,
} from "@/server/modules/master-data/master-data.service";

export type { TractorFleetItem, TrailerFleetItem, DriverFleetItem };

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
  type SavePartnerInput,
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
