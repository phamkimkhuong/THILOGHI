import { pool } from "@/server/db";
import { requireRole } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";

export interface InsuranceRateItem {
  rateId: string;
  insurerId: string;
  insurerName: string;
  coverageType: string; // ALL_RISKS, WITH_AVERAGE, FREE_FROM_PARTICULAR_AVERAGE, DOMESTIC_TRANSIT
  transportMode: string; // ROAD, OCEAN, MULTIMODAL
  commodityId: string | null;
  commodityName: string;
  pricingModel: string; // FIXED_PER_SHIPMENT, PERCENT_OF_VALUE
  rateBasis: string; // PER_CONTAINER, PER_TRUCK, PER_SHIPMENT, PERCENT_VALUE
  unitPrice: number;
  ratePercent: number;
  minPremiumVnd: number;
  deductibleVnd: number;
  maxInsuredValueVnd: number | null;
  currency: string;
  validFrom: string;
  validTo: string;
  status: string;
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SaveInsuranceRateInput {
  rateId?: string;
  insurerId: string;
  insurerName: string;
  coverageType: string;
  transportMode: string;
  commodityId?: string | null;
  commodityName?: string;
  pricingModel: string;
  rateBasis: string;
  unitPrice: number;
  ratePercent?: number;
  minPremiumVnd?: number;
  deductibleVnd?: number;
  maxInsuredValueVnd?: number | null;
  currency?: string;
  validFrom: string;
  validTo: string;
  status?: string;
  notes?: string;
}

/**
 * Lấy danh sách các công ty/đơn vị bảo hiểm đối tác từ bảng partners
 */
export async function getInsurersList(): Promise<{
  insurerId: string;
  insurerName: string;
}[]> {
  const query = `
    SELECT 
      partner_id as "insurerId",
      partner_name as "insurerName"
    FROM partners
    WHERE status = 'ACTIVE'
    ORDER BY partner_name ASC;
  `;
  const { rows } = await pool.query(query);
  return (rows || []).map((r) => ({
    insurerId: r.insurerId,
    insurerName: r.insurerName,
  }));
}

/**
 * Lấy danh sách biểu phí bảo hiểm chi tiết kèm bộ lọc
 */
export async function getInsuranceRatesDetailedList(filters?: {
  insurerId?: string;
  coverageType?: string;
  transportMode?: string;
  status?: string;
  search?: string;
}): Promise<InsuranceRateItem[]> {
  let where = "WHERE 1=1";
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.insurerId && filters.insurerId !== "ALL") {
    where += ` AND ir.insurer_id = $${idx++}`;
    params.push(filters.insurerId);
  }

  if (filters?.coverageType && filters.coverageType !== "ALL") {
    where += ` AND ir.coverage_type = $${idx++}`;
    params.push(filters.coverageType);
  }

  if (filters?.transportMode && filters.transportMode !== "ALL") {
    where += ` AND ir.transport_mode = $${idx++}`;
    params.push(filters.transportMode);
  }

  if (filters?.status && filters.status !== "ALL") {
    where += ` AND ir.status = $${idx++}`;
    params.push(filters.status);
  }

  if (filters?.search && filters.search.trim()) {
    const s = `%${filters.search.trim().toLowerCase()}%`;
    where += ` AND (
      LOWER(ir.insurer_name) LIKE $${idx}
      OR LOWER(ir.commodity_name) LIKE $${idx}
      OR LOWER(ir.coverage_type) LIKE $${idx}
      OR LOWER(ir.transport_mode) LIKE $${idx}
      OR LOWER(COALESCE(ir.notes, '')) LIKE $${idx}
    )`;
    params.push(s);
    idx++;
  }

  const query = `
    SELECT 
      ir.rate_id as "rateId",
      ir.insurer_id as "insurerId",
      ir.insurer_name as "insurerName",
      ir.coverage_type as "coverageType",
      ir.transport_mode as "transportMode",
      ir.commodity_id as "commodityId",
      ir.commodity_name as "commodityName",
      ir.pricing_model as "pricingModel",
      ir.rate_basis as "rateBasis",
      ir.unit_price as "unitPrice",
      ir.rate_percent as "ratePercent",
      ir.min_premium_vnd as "minPremiumVnd",
      ir.deductible_vnd as "deductibleVnd",
      ir.max_insured_value_vnd as "maxInsuredValueVnd",
      ir.currency,
      lower(ir.validity_range)::text as "validFrom",
      upper(ir.validity_range)::text as "validTo",
      ir.status,
      ir.notes,
      ir.created_at as "createdAt",
      ir.updated_at as "updatedAt"
    FROM insurance_rates ir
    ${where}
    ORDER BY ir.insurer_name ASC, ir.coverage_type ASC, ir.transport_mode ASC;
  `;

  const { rows } = await pool.query(query, params);

  return (rows || []).map((r) => ({
    rateId: r.rateId,
    insurerId: r.insurerId,
    insurerName: r.insurerName,
    coverageType: r.coverageType,
    transportMode: r.transportMode,
    commodityId: r.commodityId,
    commodityName: r.commodityName || "Tất cả loại hàng",
    pricingModel: r.pricingModel,
    rateBasis: r.rateBasis,
    unitPrice: Number(r.unitPrice || 0),
    ratePercent: Number(r.ratePercent || 0),
    minPremiumVnd: Number(r.minPremiumVnd || 0),
    deductibleVnd: Number(r.deductibleVnd || 0),
    maxInsuredValueVnd: r.maxInsuredValueVnd ? Number(r.maxInsuredValueVnd) : null,
    currency: r.currency || "VND",
    validFrom: r.validFrom || "",
    validTo: r.validTo || "",
    status: r.status,
    notes: r.notes || "",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Thêm mới hoặc Cập nhật biểu phí bảo hiểm
 */
export async function saveInsuranceRateService(
  input: SaveInsuranceRateInput,
  actor: CurrentActor
): Promise<{ success: true; message: string; rateId: string }> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);

  const {
    rateId,
    insurerId,
    insurerName,
    coverageType,
    transportMode,
    commodityId,
    commodityName = "Tất cả loại hàng",
    pricingModel,
    rateBasis,
    unitPrice = 0,
    ratePercent = 0,
    minPremiumVnd = 0,
    deductibleVnd = 0,
    maxInsuredValueVnd = null,
    currency = "VND",
    validFrom,
    validTo,
    status = "ACTIVE",
    notes = "",
  } = input;

  if (!insurerId) throw new Error("Vui lòng chọn công ty/đối tác bảo hiểm.");
  if (!coverageType) throw new Error("Vui lòng chọn phạm vi bảo hiểm.");
  if (!transportMode) throw new Error("Vui lòng chọn phương thức vận tải.");
  if (!pricingModel) throw new Error("Vui lòng chọn mô hình tính phí.");
  if (!rateBasis) throw new Error("Vui lòng chọn cơ sở tính phí.");
  if (unitPrice < 0) throw new Error("Đơn giá bảo hiểm không được âm.");
  if (ratePercent < 0 || ratePercent > 100) throw new Error("Tỷ lệ phần trăm bảo hiểm phải từ 0% đến 100%.");
  if (!validFrom || !validTo) throw new Error("Thời hạn hiệu lực từ ngày - đến ngày là bắt buộc.");
  if (validFrom >= validTo) throw new Error("Ngày kết thúc hiệu lực phải sau ngày bắt đầu.");

  if (rateId) {
    const updateQuery = `
      UPDATE insurance_rates
      SET 
        insurer_id = $1,
        insurer_name = $2,
        coverage_type = $3,
        transport_mode = $4,
        commodity_id = $5,
        commodity_name = $6,
        pricing_model = $7,
        rate_basis = $8,
        unit_price = $9,
        rate_percent = $10,
        min_premium_vnd = $11,
        deductible_vnd = $12,
        max_insured_value_vnd = $13,
        currency = $14,
        validity_range = daterange($15, $16, '[)'),
        status = $17,
        notes = $18,
        updated_at = CURRENT_TIMESTAMP
      WHERE rate_id = $19
      RETURNING rate_id;
    `;
    const { rows } = await pool.query(updateQuery, [
      insurerId,
      insurerName,
      coverageType,
      transportMode,
      commodityId || null,
      commodityName,
      pricingModel,
      rateBasis,
      unitPrice,
      ratePercent,
      minPremiumVnd,
      deductibleVnd,
      maxInsuredValueVnd,
      currency,
      validFrom,
      validTo,
      status,
      notes,
      rateId,
    ]);

    if (rows.length === 0) {
      throw new Error("Không tìm thấy biểu phí bảo hiểm để cập nhật.");
    }

    return {
      success: true,
      message: `Đã cập nhật biểu phí bảo hiểm [${insurerName} - ${coverageType}] thành công.`,
      rateId: rows[0].rate_id,
    };
  }

  const insertQuery = `
    INSERT INTO insurance_rates (
      insurer_id, insurer_name, coverage_type, transport_mode,
      commodity_id, commodity_name, pricing_model, rate_basis,
      unit_price, rate_percent, min_premium_vnd, deductible_vnd,
      max_insured_value_vnd, currency, validity_range, status, notes
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
      daterange($15, $16, '[)'), $17, $18
    )
    RETURNING rate_id;
  `;
  const { rows } = await pool.query(insertQuery, [
    insurerId,
    insurerName,
    coverageType,
    transportMode,
    commodityId || null,
    commodityName,
    pricingModel,
    rateBasis,
    unitPrice,
    ratePercent,
    minPremiumVnd,
    deductibleVnd,
    maxInsuredValueVnd,
    currency,
    validFrom,
    validTo,
    status,
    notes,
  ]);

  return {
    success: true,
    message: `Đã thêm mới biểu phí bảo hiểm [${insurerName} - ${coverageType}] thành công.`,
    rateId: rows[0].rate_id,
  };
}

/**
 * Đổi trạng thái biểu phí bảo hiểm (ACTIVE / INACTIVE)
 */
export async function toggleInsuranceRateStatusService(
  rateId: string,
  status: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);
  await pool.query("UPDATE insurance_rates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE rate_id = $2", [
    status,
    rateId,
  ]);
}

/**
 * Xóa biểu phí bảo hiểm
 */
export async function deleteInsuranceRateService(
  rateId: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  await pool.query("DELETE FROM insurance_rates WHERE rate_id = $1", [rateId]);
}

/**
 * Tra cứu biểu phí bảo hiểm kết nối vào Báo giá (Quotation Workspace)
 */
export async function lookupInsuranceRate(query: {
  transportMode?: string;
  coverageType?: string;
  commodityId?: string;
  commodityName?: string;
  validityDate?: string;
  invoiceValueVnd?: number;
}) {
  const rates = await getInsuranceRatesDetailedList({
    coverageType: query.coverageType,
    transportMode: query.transportMode,
    status: "ACTIVE",
  });

  const matching = rates.filter((r) => {
    // 1. Kiểm tra thời hạn hiệu lực
    if (query.validityDate) {
      if (r.validFrom && query.validityDate < r.validFrom) return false;
      if (r.validTo && query.validityDate >= r.validTo) return false;
    }
    // 2. Kiểm tra phương thức vận tải (MULTIMODAL chấp nhận cho mọi phương thức)
    if (
      query.transportMode &&
      r.transportMode !== "MULTIMODAL" &&
      r.transportMode !== query.transportMode
    ) {
      return false;
    }
    // 3. Kiểm tra mặt hàng
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
      message: "Chưa có biểu phí Bảo hiểm hàng hóa đầu vào phù hợp. Vui lòng khai báo tại phân hệ Biểu phí Bảo hiểm hoặc nhập giá vốn thủ công.",
      candidates: [],
    };
  }

  return {
    status: "MATCHED",
    message: `Tìm thấy ${matching.length} biểu phí Bảo hiểm đầu vào phù hợp.`,
    candidates: matching.map((m) => {
      let estimatedCost = m.unitPrice;
      if (m.pricingModel === "PERCENT_OF_VALUE" && query.invoiceValueVnd) {
        const calculated = (query.invoiceValueVnd * (m.ratePercent || 0)) / 100;
        estimatedCost = Math.max(calculated, m.minPremiumVnd || 0);
      }
      return {
        rateId: m.rateId,
        vendorId: m.insurerId,
        vendorName: `${m.insurerName} (${m.coverageType} - ${m.transportMode})`,
        buyRate: estimatedCost,
        unitPrice: m.unitPrice,
        ratePercent: m.ratePercent,
        rateBasis: m.rateBasis,
        pricingModel: m.pricingModel,
        minPremiumVnd: m.minPremiumVnd,
        deductibleVnd: m.deductibleVnd,
        currency: m.currency,
        validFrom: m.validFrom,
        validTo: m.validTo,
      };
    }),
  };
}
