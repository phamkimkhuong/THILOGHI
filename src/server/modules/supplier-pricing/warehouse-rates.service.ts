import { pool } from "@/server/db";
import { requireRole } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";

export interface WarehouseRateItem {
  rateId: string;
  warehouseId: string;
  warehouseName: string;
  providerId: string;
  providerName: string;
  warehouseType: string; // DRY, COLD, BONDED, CFS, OPEN_YARD
  serviceCode: string; // STORAGE, INBOUND_HANDLING, OUTBOUND_HANDLING, LOADING_UNLOADING, PICKING_PACKING, PALLET_HANDLING, COLD_STORAGE
  serviceName: string;
  commodityId: string | null;
  commodityName: string;
  rateBasis: string; // TON_DAY, PALLET_DAY, CBM_DAY, M2_DAY, LOT, MONTH, TRIP
  unitPrice: number;
  currency: string;
  freeDays: number;
  minStorageDays: number;
  minChargeVnd: number;
  validFrom: string;
  validTo: string;
  status: string;
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SaveWarehouseRateInput {
  rateId?: string;
  warehouseId: string;
  warehouseName: string;
  providerId: string;
  providerName: string;
  warehouseType: string;
  serviceCode: string;
  serviceName: string;
  commodityId?: string | null;
  commodityName?: string;
  rateBasis: string;
  unitPrice: number;
  currency?: string;
  freeDays?: number;
  minStorageDays?: number;
  minChargeVnd?: number;
  validFrom: string;
  validTo: string;
  status?: string;
  notes?: string;
}

/**
 * Lấy danh sách các đơn vị vận hành / nhà cung cấp kho từ bảng partners
 */
export async function getWarehouseProvidersList(): Promise<{
  providerId: string;
  providerName: string;
}[]> {
  const query = `
    SELECT 
      partner_id as "providerId",
      partner_name as "providerName"
    FROM partners
    WHERE status = 'ACTIVE'
    ORDER BY partner_name ASC;
  `;
  const { rows } = await pool.query(query);
  return (rows || []).map((r) => ({
    providerId: r.providerId,
    providerName: r.providerName,
  }));
}

/**
 * Lấy danh sách các Kho bãi / Điểm đóng hàng từ bảng locations
 */
export async function getWarehouseLocationsList(): Promise<{
  locationId: string;
  locationName: string;
  locationType: string;
  province?: string;
}[]> {
  const query = `
    SELECT 
      location_id as "locationId",
      name as "locationName",
      location_type as "locationType",
      province
    FROM locations
    WHERE is_active = true
    ORDER BY 
      CASE WHEN location_type = 'Warehouse' THEN 1 
           WHEN location_type = 'Stuffing Place' THEN 2 
           ELSE 3 END,
      name ASC;
  `;
  const { rows } = await pool.query(query);
  return (rows || []).map((r) => ({
    locationId: r.locationId,
    locationName: r.locationName,
    locationType: r.locationType || "Warehouse",
    province: r.province || "",
  }));
}

/**
 * Lấy danh sách chi tiết các biểu phí dịch vụ Kho bãi & Lưu trữ từ PostgreSQL
 */
export async function getWarehouseRatesDetailedList(filters?: {
  search?: string;
  warehouseId?: string;
  warehouseType?: string;
  serviceCode?: string;
  status?: string;
}): Promise<WarehouseRateItem[]> {
  let query = `
    SELECT 
      rate_id as "rateId",
      warehouse_id as "warehouseId",
      warehouse_name as "warehouseName",
      provider_id as "providerId",
      provider_name as "providerName",
      warehouse_type as "warehouseType",
      service_code as "serviceCode",
      service_name as "serviceName",
      commodity_id as "commodityId",
      commodity_name as "commodityName",
      rate_basis as "rateBasis",
      unit_price as "unitPrice",
      currency,
      free_days as "freeDays",
      min_storage_days as "minStorageDays",
      min_charge_vnd as "minChargeVnd",
      lower(validity_range)::text as "validFrom",
      upper(validity_range)::text as "validTo",
      status,
      notes,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM warehouse_rates
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.warehouseId && filters.warehouseId !== "ALL") {
    params.push(filters.warehouseId);
    query += ` AND warehouse_id = $${params.length}`;
  }

  if (filters?.warehouseType && filters.warehouseType !== "ALL") {
    params.push(filters.warehouseType);
    query += ` AND warehouse_type = $${params.length}`;
  }

  if (filters?.serviceCode && filters.serviceCode !== "ALL") {
    params.push(filters.serviceCode);
    query += ` AND service_code = $${params.length}`;
  }

  if (filters?.status && filters.status !== "ALL") {
    params.push(filters.status);
    query += ` AND status = $${params.length}`;
  }

  if (filters?.search) {
    params.push(`%${filters.search}%`);
    const pIndex = params.length;
    query += ` AND (
      warehouse_name ILIKE $${pIndex} OR 
      provider_name ILIKE $${pIndex} OR 
      service_name ILIKE $${pIndex} OR 
      commodity_name ILIKE $${pIndex} OR 
      notes ILIKE $${pIndex}
    )`;
  }

  query += ` ORDER BY created_at DESC, service_code ASC`;

  const { rows } = await pool.query(query, params);

  return (rows || []).map((r) => ({
    rateId: r.rateId,
    warehouseId: r.warehouseId,
    warehouseName: r.warehouseName,
    providerId: r.providerId,
    providerName: r.providerName,
    warehouseType: r.warehouseType || "DRY",
    serviceCode: r.serviceCode,
    serviceName: r.serviceName,
    commodityId: r.commodityId || null,
    commodityName: r.commodityName || "Tất cả loại hàng",
    rateBasis: r.rateBasis || "TON_DAY",
    unitPrice: Number(r.unitPrice || 0),
    currency: r.currency || "VND",
    freeDays: Number(r.freeDays || 0),
    minStorageDays: Number(r.minStorageDays || 1),
    minChargeVnd: Number(r.minChargeVnd || 0),
    validFrom: r.validFrom || "",
    validTo: r.validTo || "",
    status: r.status || "ACTIVE",
    notes: r.notes || "",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Thêm mới hoặc cập nhật biểu phí dịch vụ Kho bãi & Lưu trữ trong PostgreSQL
 */
export async function saveWarehouseRateService(
  input: SaveWarehouseRateInput,
  actor: CurrentActor
): Promise<{ success: boolean; message: string; rateId: string }> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);

  const warehouseId = input.warehouseId?.trim();
  const warehouseName = input.warehouseName?.trim();
  const providerId = input.providerId?.trim();
  const providerName = input.providerName?.trim();
  const warehouseType = input.warehouseType?.trim() || "DRY";
  const serviceCode = input.serviceCode?.trim();
  const serviceName = input.serviceName?.trim();
  const commodityName = input.commodityName?.trim() || "Tất cả loại hàng";
  const commodityId = input.commodityId || null;
  const rateBasis = input.rateBasis?.trim() || "TON_DAY";
  const unitPrice = Number(input.unitPrice || 0);
  const currency = input.currency || "VND";
  const freeDays = Number(input.freeDays || 0);
  const minStorageDays = Number(input.minStorageDays || 1);
  const minChargeVnd = Number(input.minChargeVnd || 0);
  const validFrom = input.validFrom;
  const validTo = input.validTo;
  const status = input.status || "ACTIVE";
  const notes = input.notes?.trim() || "";

  if (!warehouseId) throw new Error("Vui lòng chọn Kho bãi áp dụng.");
  if (!providerId) throw new Error("Vui lòng chọn Đơn vị vận hành / Nhà cung cấp kho.");
  if (!serviceCode) throw new Error("Vui lòng chọn Nhóm dịch vụ kho bãi.");
  if (unitPrice < 0) throw new Error("Đơn giá dịch vụ không được là số âm.");
  if (freeDays < 0) throw new Error("Số ngày miễn phí lưu kho không được là số âm.");
  if (minStorageDays < 0) throw new Error("Số ngày tính phí tối thiểu không hợp lệ.");
  if (minChargeVnd < 0) throw new Error("Mức cước tối thiểu không được là số âm.");
  if (!validFrom || !validTo) throw new Error("Vui lòng chọn thời hạn hiệu lực đầy đủ.");
  if (validFrom > validTo) throw new Error("Ngày kết thúc hiệu lực phải sau ngày bắt đầu.");

  if (input.rateId) {
    const updateQuery = `
      UPDATE warehouse_rates SET
        warehouse_id = $1,
        warehouse_name = $2,
        provider_id = $3,
        provider_name = $4,
        warehouse_type = $5,
        service_code = $6,
        service_name = $7,
        commodity_id = $8,
        commodity_name = $9,
        rate_basis = $10,
        unit_price = $11,
        currency = $12,
        free_days = $13,
        min_storage_days = $14,
        min_charge_vnd = $15,
        validity_range = daterange($16, $17, '[)'),
        status = $18,
        notes = $19,
        updated_at = CURRENT_TIMESTAMP
      WHERE rate_id = $20
      RETURNING rate_id;
    `;
    const { rows } = await pool.query(updateQuery, [
      warehouseId,
      warehouseName,
      providerId,
      providerName,
      warehouseType,
      serviceCode,
      serviceName,
      commodityId,
      commodityName,
      rateBasis,
      unitPrice,
      currency,
      freeDays,
      minStorageDays,
      minChargeVnd,
      validFrom,
      validTo,
      status,
      notes,
      input.rateId,
    ]);

    if (!rows || rows.length === 0) {
      throw new Error("Không tìm thấy biểu phí Kho bãi để cập nhật.");
    }

    return {
      success: true,
      message: `Đã cập nhật biểu phí Kho bãi [${serviceName} - ${warehouseName}] thành công.`,
      rateId: rows[0].rate_id,
    };
  }

  const insertQuery = `
    INSERT INTO warehouse_rates (
      warehouse_id, warehouse_name, provider_id, provider_name,
      warehouse_type, service_code, service_name, commodity_id,
      commodity_name, rate_basis, unit_price, currency,
      free_days, min_storage_days, min_charge_vnd,
      validity_range, status, notes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      daterange($16, $17, '[)'), $18, $19
    )
    RETURNING rate_id;
  `;
  const { rows } = await pool.query(insertQuery, [
    warehouseId,
    warehouseName,
    providerId,
    providerName,
    warehouseType,
    serviceCode,
    serviceName,
    commodityId,
    commodityName,
    rateBasis,
    unitPrice,
    currency,
    freeDays,
    minStorageDays,
    minChargeVnd,
    validFrom,
    validTo,
    status,
    notes,
  ]);

  return {
    success: true,
    message: `Đã thêm mới biểu phí Kho bãi [${serviceName} - ${warehouseName}] thành công.`,
    rateId: rows[0].rate_id,
  };
}

/**
 * Đổi trạng thái biểu phí Kho bãi (ACTIVE / INACTIVE)
 */
export async function toggleWarehouseRateStatusService(
  rateId: string,
  status: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);
  await pool.query("UPDATE warehouse_rates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE rate_id = $2", [
    status,
    rateId,
  ]);
}

/**
 * Xóa biểu phí dịch vụ Kho bãi
 */
export async function deleteWarehouseRateService(
  rateId: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  await pool.query("DELETE FROM warehouse_rates WHERE rate_id = $1", [rateId]);
}

/**
 * Tra cứu biểu phí Kho bãi & Lưu trữ kết nối vào Báo giá (Quotation Workspace)
 */
export async function lookupWarehouseRate(query: {
  warehouseId?: string;
  warehouseType?: string;
  serviceCode?: string;
  commodityId?: string;
  commodityName?: string;
  validityDate?: string;
  pricingDate?: string;
}) {
  const targetDate = query.pricingDate || query.validityDate;

  const rates = await getWarehouseRatesDetailedList({
    warehouseId: query.warehouseId,
    warehouseType: query.warehouseType,
    serviceCode: query.serviceCode,
    status: "ACTIVE",
  });

  const matching = rates.filter((r) => {
    // 1. Kiểm tra thời hạn hiệu lực của biểu phí
    if (targetDate) {
      if (r.validFrom && targetDate < r.validFrom) return false;
      if (r.validTo && targetDate >= r.validTo) return false;
    }
    // 2. Kiểm tra mặt hàng
    if (query.commodityName && r.commodityName !== "Tất cả loại hàng") {
      if (
        !r.commodityName.toLowerCase().includes(query.commodityName.toLowerCase()) &&
        !query.commodityName.toLowerCase().includes(r.commodityName.toLowerCase())
      ) {
        return false;
      }
    }
    return true;
  });

  if (matching.length === 0) {
    return {
      status: "MISSING_RATE",
      message: "Chưa có biểu phí dịch vụ Kho bãi đầu vào phù hợp. Vui lòng khai báo tại phân hệ Giá mua Kho bãi hoặc nhập giá vốn thủ công.",
      candidates: [],
    };
  }

  return {
    status: "MATCHED",
    message: `Tìm thấy ${matching.length} biểu phí Kho bãi đầu vào phù hợp.`,
    candidates: matching.map((m) => ({
      rateId: m.rateId,
      vendorId: m.providerId,
      vendorName: `${m.providerName} (${m.serviceName} - ${m.warehouseName})`,
      buyRate: m.unitPrice,
      rateBasis: m.rateBasis,
      currency: m.currency,
      freeDays: m.freeDays,
      minStorageDays: m.minStorageDays,
      minChargeVnd: m.minChargeVnd,
      validFrom: m.validFrom,
      validTo: m.validTo,
    })),
  };
}

