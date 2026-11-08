import { pool } from "@/server/db";
import { requireRole } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";

export interface OtherRateItem {
  rateId: string;
  serviceCode: string; // SURVEY, SPECIAL_EQUIPMENT, DOCUMENT_DELIVERY, ESCORT, OTHER_TEMPORARY
  serviceName: string;
  providerId: string;
  providerName: string;
  pricingMethod: string; // FIXED, UNIT_RATE, ACTUAL
  rateBasis: string; // LOT, SET, SHIFT, HOUR, TRIP, KM, ACTUAL_RECEIPT
  unitPrice: number;
  currency: string;
  evidenceRequired: boolean;
  validFrom: string;
  validTo: string;
  status: string;
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SaveOtherRateInput {
  rateId?: string;
  serviceCode: string;
  serviceName: string;
  providerId: string;
  providerName: string;
  pricingMethod: string;
  rateBasis: string;
  unitPrice: number;
  currency?: string;
  evidenceRequired?: boolean;
  validFrom: string;
  validTo: string;
  status?: string;
  notes?: string;
}

/**
 * Lấy danh sách các đơn vị cung cấp dịch vụ từ bảng partners
 */
export async function getOtherProvidersList(): Promise<{
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
 * Lấy danh sách biểu phí Dịch vụ khác kèm bộ lọc
 */
export async function getOtherRatesDetailedList(filters?: {
  serviceCode?: string;
  providerId?: string;
  pricingMethod?: string;
  status?: string;
  search?: string;
}): Promise<OtherRateItem[]> {
  let where = "WHERE 1=1";
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.serviceCode && filters.serviceCode !== "ALL") {
    where += ` AND ot.service_code = $${idx++}`;
    params.push(filters.serviceCode);
  }

  if (filters?.providerId && filters.providerId !== "ALL") {
    where += ` AND ot.provider_id = $${idx++}`;
    params.push(filters.providerId);
  }

  if (filters?.pricingMethod && filters.pricingMethod !== "ALL") {
    where += ` AND ot.pricing_method = $${idx++}`;
    params.push(filters.pricingMethod);
  }

  if (filters?.status && filters.status !== "ALL") {
    where += ` AND ot.status = $${idx++}`;
    params.push(filters.status);
  }

  if (filters?.search && filters.search.trim()) {
    const s = `%${filters.search.trim().toLowerCase()}%`;
    where += ` AND (
      LOWER(ot.service_name) LIKE $${idx}
      OR LOWER(ot.service_code) LIKE $${idx}
      OR LOWER(ot.provider_name) LIKE $${idx}
      OR LOWER(COALESCE(ot.notes, '')) LIKE $${idx}
    )`;
    params.push(s);
    idx++;
  }

  const query = `
    SELECT 
      ot.rate_id as "rateId",
      ot.service_code as "serviceCode",
      ot.service_name as "serviceName",
      ot.provider_id as "providerId",
      ot.provider_name as "providerName",
      ot.pricing_method as "pricingMethod",
      ot.rate_basis as "rateBasis",
      ot.unit_price as "unitPrice",
      ot.currency,
      ot.evidence_required as "evidenceRequired",
      lower(ot.validity_range)::text as "validFrom",
      upper(ot.validity_range)::text as "validTo",
      ot.status,
      ot.notes,
      ot.created_at as "createdAt",
      ot.updated_at as "updatedAt"
    FROM other_rates ot
    ${where}
    ORDER BY ot.service_code ASC, ot.service_name ASC;
  `;

  const { rows } = await pool.query(query, params);

  return (rows || []).map((r) => ({
    rateId: r.rateId,
    serviceCode: r.serviceCode,
    serviceName: r.serviceName,
    providerId: r.providerId,
    providerName: r.providerName,
    pricingMethod: r.pricingMethod,
    rateBasis: r.rateBasis,
    unitPrice: Number(r.unitPrice || 0),
    currency: r.currency || "VND",
    evidenceRequired: Boolean(r.evidenceRequired),
    validFrom: r.validFrom || "",
    validTo: r.validTo || "",
    status: r.status,
    notes: r.notes || "",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Thêm mới hoặc Cập nhật biểu phí Dịch vụ khác
 */
export async function saveOtherRateService(
  input: SaveOtherRateInput,
  actor: CurrentActor
): Promise<{ success: true; message: string; rateId: string }> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);

  const {
    rateId,
    serviceCode,
    serviceName,
    providerId,
    providerName,
    pricingMethod,
    rateBasis,
    unitPrice = 0,
    currency = "VND",
    evidenceRequired = false,
    validFrom,
    validTo,
    status = "ACTIVE",
    notes = "",
  } = input;

  if (!serviceCode) throw new Error("Vui lòng chọn mã dịch vụ chuẩn (OTHER_SERVICE_CODE).");
  if (!serviceName?.trim()) throw new Error("Vui lòng nhập tên dịch vụ chi tiết.");
  if (!providerId) throw new Error("Vui lòng chọn nhà cung cấp / đối tác thực hiện.");
  if (!pricingMethod) throw new Error("Vui lòng chọn phương pháp định giá.");
  if (!rateBasis) throw new Error("Vui lòng chọn cơ sở tính giá.");
  if (unitPrice < 0) throw new Error("Đơn giá dịch vụ không được âm.");
  if (!validFrom || !validTo) throw new Error("Thời hạn hiệu lực từ ngày - đến ngày là bắt buộc.");
  if (validFrom >= validTo) throw new Error("Ngày kết thúc hiệu lực phải sau ngày bắt đầu.");

  if (rateId) {
    const updateQuery = `
      UPDATE other_rates
      SET 
        service_code = $1,
        service_name = $2,
        provider_id = $3,
        provider_name = $4,
        pricing_method = $5,
        rate_basis = $6,
        unit_price = $7,
        currency = $8,
        evidence_required = $9,
        validity_range = daterange($10, $11, '[)'),
        status = $12,
        notes = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE rate_id = $14
      RETURNING rate_id;
    `;
    const { rows } = await pool.query(updateQuery, [
      serviceCode,
      serviceName,
      providerId,
      providerName,
      pricingMethod,
      rateBasis,
      unitPrice,
      currency,
      evidenceRequired,
      validFrom,
      validTo,
      status,
      notes,
      rateId,
    ]);

    if (rows.length === 0) {
      throw new Error("Không tìm thấy biểu phí dịch vụ khác để cập nhật.");
    }

    return {
      success: true,
      message: `Đã cập nhật biểu phí [${serviceName}] thành công.`,
      rateId: rows[0].rate_id,
    };
  }

  const insertQuery = `
    INSERT INTO other_rates (
      service_code, service_name, provider_id, provider_name,
      pricing_method, rate_basis, unit_price, currency,
      evidence_required, validity_range, status, notes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      daterange($10, $11, '[)'), $12, $13
    )
    RETURNING rate_id;
  `;
  const { rows } = await pool.query(insertQuery, [
    serviceCode,
    serviceName,
    providerId,
    providerName,
    pricingMethod,
    rateBasis,
    unitPrice,
    currency,
    evidenceRequired,
    validFrom,
    validTo,
    status,
    notes,
  ]);

  return {
    success: true,
    message: `Đã thêm mới biểu phí [${serviceName}] thành công.`,
    rateId: rows[0].rate_id,
  };
}

/**
 * Đổi trạng thái biểu phí Dịch vụ khác (ACTIVE / INACTIVE)
 */
export async function toggleOtherRateStatusService(
  rateId: string,
  status: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);
  await pool.query("UPDATE other_rates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE rate_id = $2", [
    status,
    rateId,
  ]);
}

/**
 * Xóa biểu phí Dịch vụ khác
 */
export async function deleteOtherRateService(
  rateId: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  await pool.query("DELETE FROM other_rates WHERE rate_id = $1", [rateId]);
}

/**
 * Tra cứu biểu phí Dịch vụ khác kết nối vào Báo giá (Quotation Workspace)
 */
export async function lookupOtherRate(query: {
  serviceCode?: string;
  validityDate?: string;
}) {
  const rates = await getOtherRatesDetailedList({
    serviceCode: query.serviceCode,
    status: "ACTIVE",
  });

  const matching = rates.filter((r) => {
    if (query.validityDate) {
      if (r.validFrom && query.validityDate < r.validFrom) return false;
      if (r.validTo && query.validityDate >= r.validTo) return false;
    }
    return true;
  });

  if (matching.length === 0) {
    return {
      status: "MISSING_RATE",
      message: "Chưa có biểu phí Dịch vụ khác đầu vào phù hợp. Vui lòng khai báo tại phân hệ Biểu phí Dịch vụ khác hoặc nhập giá vốn thủ công.",
      candidates: [],
    };
  }

  return {
    status: "MATCHED",
    message: `Tìm thấy ${matching.length} biểu phí Dịch vụ khác phù hợp.`,
    candidates: matching.map((m) => ({
      rateId: m.rateId,
      vendorId: m.providerId,
      vendorName: `${m.providerName} [${m.serviceName} - ${m.pricingMethod}]`,
      buyRate: m.unitPrice,
      rateBasis: m.rateBasis,
      pricingMethod: m.pricingMethod,
      evidenceRequired: m.evidenceRequired,
      currency: m.currency,
      validFrom: m.validFrom,
      validTo: m.validTo,
    })),
  };
}

