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

export const DEFAULT_PORT_RATES_SEED: PortRateItem[] = [
  {
    rateId: "p0000001-0000-4000-8000-000000000001",
    portCode: "CHU_LAI",
    portName: "Cảng Chu Lai",
    serviceCategory: "Phí xếp dỡ container",
    chargeCode: "LOLO",
    cargoType: "Empty",
    containerType: "20GP",
    unit: "Cont",
    unitPrice: 350000,
    currency: "VND",
    unitPriceVnd: 350000,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "Nâng hạ container rỗng 20 feet tiêu chuẩn",
  },
  {
    rateId: "p0000001-0000-4000-8000-000000000002",
    portCode: "CHU_LAI",
    portName: "Cảng Chu Lai",
    serviceCategory: "Phí xếp dỡ container",
    chargeCode: "LOLO",
    cargoType: "Empty",
    containerType: "20HR",
    unit: "Cont",
    unitPrice: 350000,
    currency: "VND",
    unitPriceVnd: 350000,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "Nâng hạ container rỗng 20 feet lạnh",
  },
  {
    rateId: "p0000001-0000-4000-8000-000000000003",
    portCode: "CHU_LAI",
    portName: "Cảng Chu Lai",
    serviceCategory: "Phí xếp dỡ container",
    chargeCode: "LOLO",
    cargoType: "Empty",
    containerType: "40HC",
    unit: "Cont",
    unitPrice: 450000,
    currency: "VND",
    unitPriceVnd: 450000,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "Nâng hạ container rỗng 40 feet cao",
  },
  {
    rateId: "p0000001-0000-4000-8000-000000000004",
    portCode: "CHU_LAI",
    portName: "Cảng Chu Lai",
    serviceCategory: "Phí xếp dỡ container",
    chargeCode: "LOLO",
    cargoType: "Empty",
    containerType: "40HR",
    unit: "Cont",
    unitPrice: 450000,
    currency: "VND",
    unitPriceVnd: 450000,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "Nâng hạ container rỗng 40 feet lạnh",
  },
  {
    rateId: "p0000001-0000-4000-8000-000000000005",
    portCode: "CHU_LAI",
    portName: "Cảng Chu Lai",
    serviceCategory: "Phí xếp dỡ container",
    chargeCode: "LOLO",
    cargoType: "Loaded",
    containerType: "20GP",
    unit: "Cont",
    unitPrice: 450000,
    currency: "VND",
    unitPriceVnd: 450000,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "Nâng hạ container có hàng 20 feet tiêu chuẩn",
  },
  {
    rateId: "p0000001-0000-4000-8000-000000000006",
    portCode: "CHU_LAI",
    portName: "Cảng Chu Lai",
    serviceCategory: "Phí xếp dỡ container",
    chargeCode: "LOLO",
    cargoType: "Loaded",
    containerType: "20HR",
    unit: "Cont",
    unitPrice: 675000,
    currency: "VND",
    unitPriceVnd: 675000,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "Nâng hạ container có hàng 20 feet lạnh",
  },
  {
    rateId: "p0000001-0000-4000-8000-000000000007",
    portCode: "CHU_LAI",
    portName: "Cảng Chu Lai",
    serviceCategory: "Phí xếp dỡ container",
    chargeCode: "LOLO",
    cargoType: "Loaded",
    containerType: "40HC",
    unit: "Cont",
    unitPrice: 500000,
    currency: "VND",
    unitPriceVnd: 500000,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "Nâng hạ container có hàng 40 feet cao",
  },
  {
    rateId: "p0000001-0000-4000-8000-000000000008",
    portCode: "CHU_LAI",
    portName: "Cảng Chu Lai",
    serviceCategory: "Phí xếp dỡ container",
    chargeCode: "LOLO",
    cargoType: "Loaded",
    containerType: "40HR",
    unit: "Cont",
    unitPrice: 750000,
    currency: "VND",
    unitPriceVnd: 750000,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "Nâng hạ container có hàng 40 feet lạnh",
  },
  {
    rateId: "p0000001-0000-4000-8000-000000000009",
    portCode: "CHU_LAI",
    portName: "Cảng Chu Lai",
    serviceCategory: "Phí xếp dỡ container",
    chargeCode: "THC_PORT",
    cargoType: "Loaded",
    containerType: "20HR",
    unit: "Cont",
    unitPrice: 100,
    currency: "USD",
    unitPriceVnd: 2545000,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "THC cảng container lạnh 20HR thu bằng USD",
  },
  {
    rateId: "p0000001-0000-4000-8000-000000000010",
    portCode: "CHU_LAI",
    portName: "Cảng Chu Lai",
    serviceCategory: "Phí xếp dỡ container",
    chargeCode: "THC_PORT",
    cargoType: "Loaded",
    containerType: "40HR",
    unit: "Cont",
    unitPrice: 125,
    currency: "USD",
    unitPriceVnd: 3181250,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "THC cảng container lạnh 40HR thu bằng USD",
  },
  {
    rateId: "p0000001-0000-4000-8000-000000000011",
    portCode: "CHU_LAI",
    portName: "Cảng Chu Lai",
    serviceCategory: "Phí cấp điện lạnh",
    chargeCode: "POWER",
    cargoType: "Loaded",
    containerType: "40HR",
    unit: "Giờ",
    unitPrice: 0.5,
    currency: "USD",
    unitPriceVnd: 12725,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "Phí cắm điện container lạnh tại bãi cảng Chu Lai (0.5 USD/h)",
  },
  {
    rateId: "p0000001-0000-4000-8000-000000000012",
    portCode: "CHU_LAI",
    portName: "Cảng Chu Lai",
    serviceCategory: "Phí lưu bãi container",
    chargeCode: "STORAGE",
    cargoType: "Loaded",
    containerType: "ALL",
    unit: "Ngày",
    unitPrice: 50000,
    currency: "VND",
    unitPriceVnd: 50000,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    status: "ACTIVE",
    notes: "Phí lưu bãi container sau thời gian miễn phí",
  },
];

const STANDARD_USD_FX_RATE = 25450;

/**
 * Đảm bảo bảng port_rates tồn tại và seed dữ liệu chuẩn
 */
async function ensurePortRatesTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS port_rates (
        rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        port_code VARCHAR(50) NOT NULL DEFAULT 'CHU_LAI',
        port_name VARCHAR(100) NOT NULL DEFAULT 'Cảng Chu Lai',
        service_category VARCHAR(100) NOT NULL,
        charge_code VARCHAR(50) NOT NULL,
        cargo_type VARCHAR(50) NOT NULL DEFAULT 'Loaded',
        container_type VARCHAR(30) NOT NULL,
        unit VARCHAR(20) NOT NULL DEFAULT 'Cont',
        unit_price NUMERIC(15, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'VND',
        validity_range DATERANGE NOT NULL DEFAULT daterange('2026-01-01', '2027-01-01', '[)'),
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const countRes = await pool.query("SELECT COUNT(*) FROM port_rates");
    if (Number(countRes.rows[0]?.count || 0) === 0) {
      for (const item of DEFAULT_PORT_RATES_SEED) {
        await pool.query(
          `INSERT INTO port_rates (rate_id, port_code, port_name, service_category, charge_code, cargo_type, container_type, unit, unit_price, currency, validity_range, status, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, daterange($11, $12, '[)'), $13, $14)
           ON CONFLICT DO NOTHING`,
          [
            item.rateId,
            item.portCode,
            item.portName,
            item.serviceCategory,
            item.chargeCode,
            item.cargoType,
            item.containerType,
            item.unit,
            item.unitPrice,
            item.currency,
            item.validFrom,
            item.validTo,
            item.status,
            item.notes,
          ]
        );
      }
    }
  } catch {
    // Fail-safe
  }
}

/**
 * Lấy danh sách chi tiết các biểu phí Cảng Chu Lai
 */
export async function getPortRatesDetailedList(filters?: {
  search?: string;
  chargeCode?: string;
  containerType?: string;
  status?: string;
}): Promise<PortRateItem[]> {
  await ensurePortRatesTable();

  try {
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
      query += ` AND (service_category ILIKE $${params.length} OR charge_code ILIKE $${params.length} OR container_type ILIKE $${params.length} OR notes ILIKE $${params.length})`;
    }

    query += ` ORDER BY charge_code ASC, container_type ASC, cargo_type ASC`;

    const { rows } = await pool.query(query, params);

    if (rows && rows.length > 0) {
      return rows.map((r) => {
        const price = Number(r.unitPrice);
        const priceVnd =
          r.currency === "USD" ? roundVnd(price * STANDARD_USD_FX_RATE) : price;

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
  } catch {
    // Fallback in-memory
  }

  return DEFAULT_PORT_RATES_SEED.filter((item) => {
    if (filters?.chargeCode && filters.chargeCode !== "ALL" && item.chargeCode !== filters.chargeCode) {
      return false;
    }
    if (filters?.containerType && filters.containerType !== "ALL" && item.containerType !== filters.containerType) {
      return false;
    }
    if (filters?.status && filters.status !== "ALL" && item.status !== filters.status) {
      return false;
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      return (
        item.serviceCategory.toLowerCase().includes(q) ||
        item.chargeCode.toLowerCase().includes(q) ||
        item.containerType.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
      );
    }
    return true;
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
 * Lưu hoặc cập nhật biểu phí Cảng Chu Lai
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

  await ensurePortRatesTable();

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
          ? roundVnd(Number(r.unit_price) * STANDARD_USD_FX_RATE)
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
        ? roundVnd(Number(r.unit_price) * STANDARD_USD_FX_RATE)
        : Number(r.unit_price),
    validFrom,
    validTo,
    status: r.status,
    notes: r.notes || "",
  };
}

/**
 * Đổi trạng thái biểu phí Cảng Chu Lai
 */
export async function togglePortRateStatusService(
  rateId: string,
  status: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST"]);
  await ensurePortRatesTable();
  await pool.query("UPDATE port_rates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE rate_id = $2", [
    status,
    rateId,
  ]);
}

/**
 * Xóa biểu phí Cảng Chu Lai
 */
export async function deletePortRateService(
  rateId: string,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  await ensurePortRatesTable();
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
 * Tra cứu tự động biểu cước Cảng Chu Lai theo chuẩn THILOGI Rule 10.2
 */
export async function lookupPortRates(
  query: PortRateLookupQuery
): Promise<PortRateLookupResult> {
  const allRates = await getPortRatesDetailedList({
    status: "ACTIVE",
    chargeCode: query.chargeCode,
    containerType: query.containerType,
  });

  const matching = allRates.filter((r) => {
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

