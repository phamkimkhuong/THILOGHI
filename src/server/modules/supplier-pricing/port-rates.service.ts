import { pool } from "@/server/db";
import { requireRole } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";
import { roundVnd } from "@/shared/utils/pricing";

export interface PortRateItem {
  rateId: string;
  portCode: string;
  portName: string;
  serviceCategory: string;
  chargeCode: string;
  cargoType: string;
  containerType: string;
  unit: string;
  unitPrice: number;
  currency: string;
  unitPriceVnd: number;
  validFrom: string;
  validTo: string;
  status: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

const STANDARD_USD_FX_RATE = 25450;

/**
 * Lấy danh sách chi tiết các biểu phí Cảng trực tiếp từ PostgreSQL
 */
export async function getPortRatesDetailedList(filters?: {
  search?: string;
  portCode?: string;
  chargeCode?: string;
  containerType?: string;
  status?: string;
}): Promise<PortRateItem[]> {
  let query = `
    SELECT 
      rate_id as "rateId",
      port_code as "portCode",
      port_name as "portName",
      service_category as "serviceCategory",
      charge_code as "chargeCode",
      cargo_type as "cargoType",
      container_type as "containerType",
      unit,
      unit_price as "unitPrice",
      currency,
      lower(validity_range)::text as "validFrom",
      upper(validity_range)::text as "validTo",
      status,
      notes,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM port_rates
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.portCode && filters.portCode !== "ALL") {
    if (filters.portCode === "VNTAP" || filters.portCode === "CHU_LAI") {
      query += ` AND (port_code = 'VNTAP' OR port_code = 'CHU_LAI')`;
    } else {
      params.push(filters.portCode);
      query += ` AND port_code = $${params.length}`;
    }
  }

  if (filters?.chargeCode && filters.chargeCode !== "ALL") {
    params.push(filters.chargeCode);
    query += ` AND charge_code = $${params.length}`;
  }

  if (filters?.containerType && filters.containerType !== "ALL") {
    params.push(filters.containerType);
    query += ` AND container_type = $${params.length}`;
  }

  if (filters?.status && filters.status !== "ALL") {
    params.push(filters.status);
    query += ` AND status = $${params.length}`;
  }

  if (filters?.search) {
    params.push(`%${filters.search}%`);
    query += ` AND (port_code ILIKE $${params.length} OR port_name ILIKE $${params.length} OR service_category ILIKE $${params.length} OR charge_code ILIKE $${params.length} OR container_type ILIKE $${params.length} OR notes ILIKE $${params.length})`;
  }

  query += ` ORDER BY charge_code ASC, container_type ASC, cargo_type ASC`;

  const { rows } = await pool.query(query, params);

  return (rows || []).map((r) => {
    const price = Number(r.unitPrice);
    const priceVnd =
      r.currency === "USD"
        ? roundVnd(price * STANDARD_USD_FX_RATE).toNumber()
        : price;

    return {
      rateId: r.rateId,
      portCode: r.portCode,
      portName: r.portName,
      serviceCategory: r.serviceCategory,
      chargeCode: r.chargeCode,
      cargoType: r.cargoType,
      containerType: r.containerType,
      unit: r.unit,
      unitPrice: price,
      currency: r.currency,
      unitPriceVnd: priceVnd,
      validFrom: r.validFrom || "2026-01-01",
      validTo: r.validTo || "2026-12-31",
      status: r.status || "ACTIVE",
      notes: r.notes || "",
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });
}

export interface SavePortRateInput {
  rateId?: string;
  portCode?: string;
  portName?: string;
  serviceCategory: string;
  chargeCode: string;
  cargoType: string;
  containerType: string;
  unit: string;
  unitPrice: number;
  currency: string;
  validFrom: string;
  validTo: string;
  status?: string;
  notes?: string;
}

/**
 * Lưu hoặc cập nhật biểu phí Cảng trực tiếp vào PostgreSQL
 */
export async function savePortRateService(
  input: SavePortRateInput,
  actor: CurrentActor
): Promise<PortRateItem> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);

  const portCode = (input.portCode || "CHU_LAI").trim();
  const portName = (input.portName || "Cảng Chu Lai").trim();
  const serviceCategory = input.serviceCategory.trim();
  const chargeCode = input.chargeCode.trim().toUpperCase();
  const cargoType = input.cargoType.trim();
  const containerType = input.containerType.trim().toUpperCase();
  const unit = input.unit.trim();
  const unitPrice = Number(input.unitPrice);
  const currency = (input.currency || "VND").trim().toUpperCase();
  const validFrom = input.validFrom.trim();
  const validTo = input.validTo.trim();
  const status = (input.status || "ACTIVE").trim();
  const notes = (input.notes || "").trim();

  if (!serviceCategory) throw new Error("Vui lòng chọn nhóm dịch vụ cảng.");
  if (!chargeCode) throw new Error("Vui lòng nhập mã tác nghiệp (LOLO, POWER...).");
  if (isNaN(unitPrice) || unitPrice < 0) throw new Error("Đơn giá không hợp lệ.");

  if (input.rateId) {
    const query = `
      UPDATE port_rates
      SET port_code = $1, port_name = $2, service_category = $3, charge_code = $4,
          cargo_type = $5, container_type = $6, unit = $7, unit_price = $8,
          currency = $9, validity_range = daterange($10, $11, '[)'), status = $12,
          notes = $13, updated_at = CURRENT_TIMESTAMP
      WHERE rate_id = $14
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      portCode,
      portName,
      serviceCategory,
      chargeCode,
      cargoType,
      containerType,
      unit,
      unitPrice,
      currency,
      validFrom,
      validTo,
      status,
      notes,
      input.rateId,
    ]);

    if (!rows || rows.length === 0) {
      throw new Error("Không tìm thấy biểu phí cảng cần cập nhật.");
    }

    const r = rows[0];
    return {
      rateId: r.rate_id,
      portCode: r.port_code,
      portName: r.port_name,
      serviceCategory: r.service_category,
      chargeCode: r.charge_code,
      cargoType: r.cargo_type,
      containerType: r.container_type,
      unit: r.unit,
      unitPrice: Number(r.unit_price),
      currency: r.currency,
      unitPriceVnd:
        r.currency === "USD"
          ? roundVnd(Number(r.unit_price) * STANDARD_USD_FX_RATE).toNumber()
          : Number(r.unit_price),
      validFrom,
      validTo,
      status: r.status,
      notes: r.notes || "",
    };
  }

  const insertQuery = `
    INSERT INTO port_rates (
      port_code, port_name, service_category, charge_code, cargo_type,
      container_type, unit, unit_price, currency, validity_range, status, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, daterange($10, $11, '[)'), $12, $13)
    RETURNING *;
  `;
  const { rows } = await pool.query(insertQuery, [
    portCode,
    portName,
    serviceCategory,
    chargeCode,
    cargoType,
    containerType,
    unit,
    unitPrice,
    currency,
    validFrom,
    validTo,
    status,
    notes,
  ]);

  const r = rows[0];
  return {
    rateId: r.rate_id,
    portCode: r.port_code,
    portName: r.port_name,
    serviceCategory: r.service_category,
    chargeCode: r.charge_code,
    cargoType: r.cargo_type,
    containerType: r.container_type,
    unit: r.unit,
    unitPrice: Number(r.unit_price),
    currency: r.currency,
    unitPriceVnd:
      r.currency === "USD"
        ? roundVnd(Number(r.unit_price) * STANDARD_USD_FX_RATE).toNumber()
        : Number(r.unit_price),
    validFrom,
    validTo,
    status: r.status,
    notes: r.notes || "",
  };
}

/**
 * Đổi trạng thái biểu phí Cảng trong PostgreSQL
 */
export async function togglePortRateStatusService(
  rateId: string,
  status: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);
  await pool.query("UPDATE port_rates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE rate_id = $2", [
    status,
    rateId,
  ]);
}

/**
 * Xóa biểu phí Cảng trong PostgreSQL
 */
export async function deletePortRateService(
  rateId: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  await pool.query("DELETE FROM port_rates WHERE rate_id = $1", [rateId]);
}

export interface PortRateLookupQuery {
  portCode?: string;
  chargeCode?: string;
  containerType?: string;
  cargoType?: string;
  pricingDate?: string;
}

export interface PortRateLookupResult {
  status: "MATCHED" | "MISSING_RATE" | "CONFLICT_RATE";
  message: string;
  rate?: PortRateItem;
  candidates: PortRateItem[];
}

/**
 * Tra cứu tự động biểu cước Cảng theo chuẩn THILOGI Rule 10.2
 */
export async function lookupPortRates(
  query: PortRateLookupQuery
): Promise<PortRateLookupResult> {
  const allRates = await getPortRatesDetailedList({
    status: "ACTIVE",
    portCode: query.portCode,
    chargeCode: query.chargeCode,
    containerType: query.containerType,
  });

  const matching = allRates.filter((r) => {
    if (query.portCode && query.portCode !== "ALL") {
      const matchPort = (p: string) =>
        p === query.portCode ||
        ((query.portCode === "VNTAP" || query.portCode === "CHU_LAI") &&
         (p === "CHU_LAI" || p === "VNTAP"));
      if (!matchPort(r.portCode)) return false;
    }
    if (query.chargeCode && r.chargeCode !== query.chargeCode) return false;
    if (query.containerType && r.containerType !== "ALL" && r.containerType !== query.containerType) {
      return false;
    }
    if (query.cargoType && r.cargoType !== query.cargoType) return false;
    return true;
  });

  if (matching.length === 0) {
    return {
      status: "MISSING_RATE",
      message: "Không tìm thấy biểu phí cảng phù hợp với điều kiện tra cứu.",
      candidates: [],
    };
  }

  if (matching.length === 1) {
    return {
      status: "MATCHED",
      message: "Tìm thấy biểu phí cảng hợp lệ.",
      rate: matching[0],
      candidates: matching,
    };
  }

  return {
    status: "CONFLICT_RATE",
    message: "Tìm thấy nhiều biểu phí cảng trùng lặp điều kiện tác nghiệp.",
    candidates: matching,
  };
}
