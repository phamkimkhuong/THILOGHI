import { pool } from "@/server/db";
import { requireRole } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";

export interface CustomsRateItem {
  rateId: string;
  providerId: string;
  providerName: string;
  customsOfficeId: string;
  customsOfficeName: string;
  countryCode: string;
  customsProcedure: string; // EXPORT, IMPORT, TRANSIT, TEMP_IMPORT_REEXPORT, TEMP_EXPORT_REIMPORT
  serviceCode: string; // DECLARATION, INSPECTION, QUARANTINE, PERMIT, LIQUIDATION
  serviceName: string;
  commodityId: string | null;
  commodityName: string;
  rateBasis: string; // PER_DECLARATION, PER_CONTAINER, PER_TRUCK, PER_TON, PER_LOT
  unitPrice: number;
  currency: string;
  validFrom: string;
  validTo: string;
  status: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveCustomsRateInput {
  rateId?: string;
  providerId: string;
  providerName: string;
  customsOfficeId: string;
  customsOfficeName: string;
  countryCode?: string;
  customsProcedure: string;
  serviceCode: string;
  serviceName: string;
  commodityId?: string | null;
  commodityName: string;
  rateBasis: string;
  unitPrice: number;
  currency?: string;
  validFrom: string;
  validTo: string;
  status?: string;
  notes?: string;
}

/**
 * Lấy danh sách đại lý / nhà cung cấp dịch vụ Hải quan trực tiếp từ vendors JOIN partners
 */
export async function getCustomsBrokersList(): Promise<{ providerId: string; providerName: string }[]> {
  const query = `
    SELECT 
      v.vendor_id as "providerId",
      p.partner_name as "providerName"
    FROM vendors v
    JOIN partners p ON v.vendor_id = p.partner_id
    ORDER BY p.partner_name ASC;
  `;
  const { rows } = await pool.query(query);
  return (rows || []).map((r) => ({
    providerId: r.providerId,
    providerName: r.providerName,
  }));
}

/**
 * Lấy danh sách Chi cục / Địa điểm làm thủ tục Hải quan trực tiếp từ bảng locations
 */
export async function getCustomsOfficesList(): Promise<{
  officeId: string;
  officeName: string;
  countryCode: string;
  province?: string;
}[]> {
  const query = `
    SELECT 
      location_id as "officeId",
      name as "officeName",
      country_code as "countryCode",
      province
    FROM locations
    ORDER BY name ASC;
  `;
  const { rows } = await pool.query(query);
  return (rows || []).map((r) => ({
    officeId: r.officeId,
    officeName: r.officeName,
    countryCode: r.countryCode || "VN",
    province: r.province || "",
  }));
}

/**
 * Lấy danh sách chi tiết các biểu phí Hải quan trực tiếp từ PostgreSQL
 */
export async function getCustomsRatesDetailedList(filters?: {
  search?: string;
  customsOfficeId?: string;
  procedure?: string;
  serviceCode?: string;
  status?: string;
}): Promise<CustomsRateItem[]> {
  let query = `
    SELECT 
      rate_id as "rateId",
      provider_id as "providerId",
      provider_name as "providerName",
      customs_office_id as "customsOfficeId",
      customs_office_name as "customsOfficeName",
      country_code as "countryCode",
      customs_procedure as "customsProcedure",
      service_code as "serviceCode",
      service_name as "serviceName",
      commodity_id as "commodityId",
      commodity_name as "commodityName",
      rate_basis as "rateBasis",
      unit_price as "unitPrice",
      currency,
      lower(validity_range)::text as "validFrom",
      upper(validity_range)::text as "validTo",
      status,
      notes,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM customs_rates
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.customsOfficeId && filters.customsOfficeId !== "ALL") {
    params.push(filters.customsOfficeId);
    query += ` AND customs_office_id = $${params.length}`;
  }

  if (filters?.procedure && filters.procedure !== "ALL") {
    params.push(filters.procedure);
    query += ` AND customs_procedure = $${params.length}`;
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
      provider_name ILIKE $${pIndex} OR 
      customs_office_name ILIKE $${pIndex} OR 
      service_name ILIKE $${pIndex} OR 
      commodity_name ILIKE $${pIndex} OR 
      notes ILIKE $${pIndex}
    )`;
  }

  query += ` ORDER BY created_at DESC, customs_procedure ASC`;

  const { rows } = await pool.query(query, params);

  return (rows || []).map((r) => ({
    rateId: r.rateId,
    providerId: r.providerId,
    providerName: r.providerName,
    customsOfficeId: r.customsOfficeId,
    customsOfficeName: r.customsOfficeName,
    countryCode: r.countryCode || "VN",
    customsProcedure: r.customsProcedure,
    serviceCode: r.serviceCode,
    serviceName: r.serviceName,
    commodityId: r.commodityId || null,
    commodityName: r.commodityName || "Tất cả loại hàng",
    rateBasis: r.rateBasis || "PER_DECLARATION",
    unitPrice: Number(r.unitPrice || 0),
    currency: r.currency || "VND",
    validFrom: r.validFrom || "",
    validTo: r.validTo || "",
    status: r.status || "ACTIVE",
    notes: r.notes || "",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Thêm mới hoặc chỉnh sửa biểu phí dịch vụ Hải quan trong PostgreSQL
 */
export async function saveCustomsRateService(
  input: SaveCustomsRateInput,
  actor: CurrentActor
): Promise<{ success: boolean; message: string; rateId: string }> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);

  const providerId = input.providerId?.trim();
  const providerName = input.providerName?.trim();
  const customsOfficeId = input.customsOfficeId?.trim();
  const customsOfficeName = input.customsOfficeName?.trim();
  const customsProcedure = input.customsProcedure?.trim();
  const serviceCode = input.serviceCode?.trim();
  const serviceName = input.serviceName?.trim();
  const commodityName = input.commodityName?.trim();
  const commodityId = input.commodityId || null;
  const rateBasis = input.rateBasis?.trim() || "PER_DECLARATION";
  const unitPrice = Number(input.unitPrice || 0);
  const currency = input.currency || "VND";
  const countryCode = input.countryCode || "VN";
  const validFrom = input.validFrom;
  const validTo = input.validTo;
  const status = input.status || "ACTIVE";
  const notes = input.notes?.trim() || "";

  if (!providerId) throw new Error("Vui lòng chọn đơn vị / đại lý cung cấp dịch vụ Hải quan.");
  if (!customsOfficeId) throw new Error("Vui lòng chọn Chi cục / Địa điểm làm thủ tục Hải quan.");
  if (!customsProcedure) throw new Error("Vui lòng chọn loại hình thủ tục Hải quan.");
  if (!serviceCode) throw new Error("Vui lòng chọn nhóm dịch vụ Hải quan.");
  if (!commodityName) throw new Error("Vui lòng chọn mặt hàng áp dụng từ danh mục.");
  if (unitPrice < 0) throw new Error("Đơn giá dịch vụ không được là số âm.");
  if (!validFrom || !validTo) throw new Error("Vui lòng chọn thời hạn hiệu lực đầy đủ.");
  if (validFrom > validTo) throw new Error("Ngày kết thúc hiệu lực phải sau ngày bắt đầu.");

  if (input.rateId) {
    const updateQuery = `
      UPDATE customs_rates SET
        provider_id = $1,
        provider_name = $2,
        customs_office_id = $3,
        customs_office_name = $4,
        country_code = $5,
        customs_procedure = $6,
        service_code = $7,
        service_name = $8,
        commodity_id = $9,
        commodity_name = $10,
        rate_basis = $11,
        unit_price = $12,
        currency = $13,
        validity_range = daterange($14, $15, '[)'),
        status = $16,
        notes = $17,
        updated_at = CURRENT_TIMESTAMP
      WHERE rate_id = $18
      RETURNING rate_id;
    `;
    const { rows } = await pool.query(updateQuery, [
      providerId,
      providerName,
      customsOfficeId,
      customsOfficeName,
      countryCode,
      customsProcedure,
      serviceCode,
      serviceName,
      commodityId,
      commodityName,
      rateBasis,
      unitPrice,
      currency,
      validFrom,
      validTo,
      status,
      notes,
      input.rateId,
    ]);

    if (!rows || rows.length === 0) {
      throw new Error("Không tìm thấy biểu phí Hải quan để cập nhật.");
    }

    return {
      success: true,
      message: `Đã cập nhật biểu phí Hải quan [${serviceName} - ${customsOfficeName}] thành công.`,
      rateId: rows[0].rate_id,
    };
  }

  const insertQuery = `
    INSERT INTO customs_rates (
      provider_id, provider_name, customs_office_id, customs_office_name,
      country_code, customs_procedure, service_code, service_name,
      commodity_id, commodity_name, rate_basis, unit_price,
      currency, validity_range, status, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, daterange($14, $15, '[)'), $16, $17)
    RETURNING rate_id;
  `;
  const { rows } = await pool.query(insertQuery, [
    providerId,
    providerName,
    customsOfficeId,
    customsOfficeName,
    countryCode,
    customsProcedure,
    serviceCode,
    serviceName,
    commodityId,
    commodityName,
    rateBasis,
    unitPrice,
    currency,
    validFrom,
    validTo,
    status,
    notes,
  ]);

  return {
    success: true,
    message: `Đã thêm mới biểu phí Hải quan [${serviceName} - ${customsOfficeName}] thành công.`,
    rateId: rows[0].rate_id,
  };
}

/**
 * Đổi trạng thái biểu phí Hải quan (ACTIVE / INACTIVE)
 */
export async function toggleCustomsRateStatusService(
  rateId: string,
  status: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);
  await pool.query("UPDATE customs_rates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE rate_id = $2", [
    status,
    rateId,
  ]);
}

/**
 * Xóa biểu phí dịch vụ Hải quan
 */
export async function deleteCustomsRateService(
  rateId: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  await pool.query("DELETE FROM customs_rates WHERE rate_id = $1", [rateId]);
}

/**
 * Tra cứu biểu phí Hải quan đầu vào kết nối vào Báo giá (Quotation Workspace)
 */
export async function lookupCustomsRate(query: {
  customsOfficeId?: string;
  customsProcedure?: string;
  serviceCode?: string;
  commodityId?: string;
  commodityName?: string;
  validityDate?: string;
  pricingDate?: string;
}) {
  const targetDate = query.pricingDate || query.validityDate;

  const rates = await getCustomsRatesDetailedList({
    customsOfficeId: query.customsOfficeId,
    procedure: query.customsProcedure,
    serviceCode: query.serviceCode,
    status: "ACTIVE",
  });

  const matching = rates.filter((r) => {
    // Kiểm tra thời hạn hiệu lực của biểu phí
    if (targetDate) {
      if (r.validFrom && targetDate < r.validFrom) return false;
      if (r.validTo && targetDate >= r.validTo) return false;
    }
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
      message: "Chưa có biểu phí dịch vụ Hải quan đầu vào phù hợp. Vui lòng khai báo tại phân hệ Giá mua Hải quan hoặc nhập giá vốn thủ công.",
      candidates: [],
    };
  }

  return {
    status: "MATCHED",
    message: `Tìm thấy ${matching.length} biểu phí Hải quan đầu vào phù hợp.`,
    candidates: matching.map((m) => ({
      rateId: m.rateId,
      vendorId: m.providerId,
      vendorName: `${m.providerName} (${m.serviceName} - ${m.customsOfficeName})`,
      buyRate: m.unitPrice,
      rateBasis: m.rateBasis,
      currency: m.currency,
      validFrom: m.validFrom,
      validTo: m.validTo,
    })),
  };
}

