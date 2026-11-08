import { pool } from "@/server/db";
import { requireRole } from "@/server/auth/authorize";
import type { CurrentActor } from "@/server/auth/types";

export interface MasterServicePackage {
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  categoryName: string;
  description: string;
  defaultUnit: string;
  pricingType: "ROUTE_BASED" | "UNIT_BASED";
  isCoreTransport: boolean;
  isActive: boolean;
  sortOrder: number;
  typicalCharges: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const CATEGORY_NAME_MAP: Record<string, string> = {
  CORE_TRANSPORT: "Vận tải chính",
  PORT_DEPOT: "Cảng & Depot",
  CLEARANCE: "Hải quan & Cửa khẩu",
  WAREHOUSE: "Kho bãi & Lưu trữ",
  VALUE_ADDED: "Dịch vụ gia tăng",
};

export const DEFAULT_SERVICES_SEED: MasterServicePackage[] = [
  {
    serviceId: "TRUCKING",
    serviceName: "Vận tải đường bộ",
    serviceCategory: "CORE_TRANSPORT",
    categoryName: "Vận tải chính",
    description: "Di chuyển hàng bằng phương tiện đường bộ (xe đầu kéo, xe tải thùng, xe chuyên dụng). Phạm vi D2D, D2P, P2D nội địa & liên vận quốc tế.",
    defaultUnit: "TRIP",
    pricingType: "ROUTE_BASED",
    isCoreTransport: true,
    isActive: true,
    sortOrder: 1,
    typicalCharges: ["ROAD_FREIGHT", "OVERWEIGHT_SURCHARGE", "DETENTION_FEE"],
  },
  {
    serviceId: "OCEAN",
    serviceName: "Vận tải biển",
    serviceCategory: "CORE_TRANSPORT",
    categoryName: "Vận tải chính",
    description: "Vận chuyển đường biển từ cảng xếp POL đến cảng dỡ POD. Quản lý cước tàu và các phụ phí hãng tàu (LCC/THC/BAF/CAF).",
    defaultUnit: "CONT",
    pricingType: "ROUTE_BASED",
    isCoreTransport: true,
    isActive: true,
    sortOrder: 2,
    typicalCharges: ["OCEAN_FREIGHT", "THC_SHIPPING_LINE", "DOCS", "SEAL", "BAF", "CAF", "CIC"],
  },
  {
    serviceId: "PORT",
    serviceName: "Cảng & Depot",
    serviceCategory: "PORT_DEPOT",
    categoryName: "Cảng & Depot",
    description: "Tác nghiệp container và hàng hóa tại Cảng Chu Lai, Terminal và Container Depot nội bộ hoặc thuê ngoài.",
    defaultUnit: "CONT",
    pricingType: "UNIT_BASED",
    isCoreTransport: false,
    isActive: true,
    sortOrder: 3,
    typicalCharges: ["LOLO", "POWER_CHARGE", "THC_PORT", "TRANSLOADING", "STORAGE_YARD", "CARGO_HANDLING"],
  },
  {
    serviceId: "CUSTOMS",
    serviceName: "Xuất nhập khẩu & Hải quan",
    serviceCategory: "CLEARANCE",
    categoryName: "Hải quan & Cửa khẩu",
    description: "Thực hiện thủ tục hải quan, mở tờ khai XNK, thông quan quá cảnh, xin giấy phép C/O, kiểm định chuyên ngành.",
    defaultUnit: "DECLARATION",
    pricingType: "UNIT_BASED",
    isCoreTransport: false,
    isActive: true,
    sortOrder: 4,
    typicalCharges: ["PER_DECLARATION", "PER_TRUCK", "QUARANTINE_FEE", "INFRASTRUCTURE_FEE", "ENTRY_EXIT_FEE"],
  },
  {
    serviceId: "BORDER_GATE",
    serviceName: "Cửa khẩu & Bãi kiểm hóa",
    serviceCategory: "CLEARANCE",
    categoryName: "Hải quan & Cửa khẩu",
    description: "Tác nghiệp hiện trường tại các cặp cửa khẩu Việt - Lào - Campuchia (Bờ Y, Nam Giang, Cha Lo...). Ra vào bãi, trạm cân, sang xe.",
    defaultUnit: "TRUCK",
    pricingType: "UNIT_BASED",
    isCoreTransport: false,
    isActive: true,
    sortOrder: 5,
    typicalCharges: ["BORDER_INFRASTRUCTURE", "YARD_ENTRY_EXIT", "WEIGHING_FEE", "BORDER_HANDLING", "TRANSIT_FEE"],
  },
  {
    serviceId: "WAREHOUSING",
    serviceName: "Kho bãi & Lưu trữ",
    serviceCategory: "WAREHOUSE",
    categoryName: "Kho bãi & Lưu trữ",
    description: "Lưu giữ và xử lý hàng hóa tại hệ thống kho Chu Lai (Kho tổng hợp, kho CFS, kho ngoại quan, kho lạnh).",
    defaultUnit: "TON/DAY",
    pricingType: "UNIT_BASED",
    isCoreTransport: false,
    isActive: true,
    sortOrder: 6,
    typicalCharges: ["STORAGE", "INBOUND_HANDLING", "OUTBOUND_HANDLING", "LOADING_UNLOADING", "COLD_STORAGE", "PALLETIZING"],
  },
  {
    serviceId: "INSURANCE",
    serviceName: "Bảo hiểm hàng hóa",
    serviceCategory: "VALUE_ADDED",
    categoryName: "Dịch vụ gia tăng",
    description: "Bảo hiểm rủi ro hàng hóa trong quá trình vận chuyển đường bộ, đường biển hoặc đa phương thức.",
    defaultUnit: "SHIPMENT",
    pricingType: "UNIT_BASED",
    isCoreTransport: false,
    isActive: true,
    sortOrder: 7,
    typicalCharges: ["CARGO_INSURANCE_PREMIUM", "MINIMUM_PREMIUM", "SURVEY_FEE"],
  },
  {
    serviceId: "OTHER",
    serviceName: "Dịch vụ khác có kiểm soát",
    serviceCategory: "VALUE_ADDED",
    categoryName: "Dịch vụ gia tăng",
    description: "Dịch vụ bổ trợ đặc thù có mã kiểm soát: giám định chất lượng, phương tiện hộ tống, dán tem nhãn, hoa hồng.",
    defaultUnit: "LOT",
    pricingType: "UNIT_BASED",
    isCoreTransport: false,
    isActive: true,
    sortOrder: 8,
    typicalCharges: ["SURVEY", "SPECIAL_EQUIPMENT", "ESCORT", "DOCUMENT_DELIVERY", "COMMISSION"],
  },
];

/**
 * Đảm bảo bảng services tồn tại và đã seed dữ liệu
 */
async function ensureServicesTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        service_id VARCHAR(50) PRIMARY KEY,
        service_name VARCHAR(255) NOT NULL,
        service_category VARCHAR(50) NOT NULL,
        description TEXT,
        default_unit VARCHAR(20) DEFAULT 'TRIP',
        pricing_type VARCHAR(30) DEFAULT 'ROUTE_BASED',
        is_core_transport BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        sort_order INT DEFAULT 0,
        typical_charges JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Kiểm tra số lượng dòng
    const countRes = await pool.query("SELECT COUNT(*) FROM services");
    if (Number(countRes.rows[0]?.count || 0) === 0) {
      for (const s of DEFAULT_SERVICES_SEED) {
        await pool.query(
          `INSERT INTO services (service_id, service_name, service_category, description, default_unit, pricing_type, is_core_transport, is_active, sort_order, typical_charges)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (service_id) DO NOTHING`,
          [
            s.serviceId,
            s.serviceName,
            s.serviceCategory,
            s.description,
            s.defaultUnit,
            s.pricingType,
            s.isCoreTransport,
            s.isActive,
            s.sortOrder,
            JSON.stringify(s.typicalCharges),
          ]
        );
      }
    }
  } catch {
    // Không chặn luồng nếu pool mock hoặc có lỗi kết nối
  }
}

/**
 * Lấy danh sách 8 gói dịch vụ chuẩn với bộ lọc
 */
export async function getMasterServicesList(filters?: {
  search?: string;
  category?: string;
  status?: string;
}): Promise<MasterServicePackage[]> {
  await ensureServicesTable();

  try {
    let query = `
      SELECT 
        service_id as "serviceId",
        service_name as "serviceName",
        service_category as "serviceCategory",
        description,
        default_unit as "defaultUnit",
        pricing_type as "pricingType",
        is_core_transport as "isCoreTransport",
        is_active as "isActive",
        sort_order as "sortOrder",
        typical_charges as "typicalCharges",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM services
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (filters?.category && filters.category !== "ALL") {
      params.push(filters.category);
      query += ` AND service_category = $${params.length}`;
    }

    if (filters?.status === "ACTIVE") {
      query += ` AND is_active = true`;
    } else if (filters?.status === "INACTIVE") {
      query += ` AND is_active = false`;
    }

    if (filters?.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (service_id ILIKE $${params.length} OR service_name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    query += ` ORDER BY sort_order ASC, service_id ASC`;

    const { rows } = await pool.query(query, params);

    return (rows || []).map((r) => ({
      serviceId: r.serviceId,
      serviceName: r.serviceName,
      serviceCategory: r.serviceCategory,
      categoryName: CATEGORY_NAME_MAP[r.serviceCategory] || r.serviceCategory,
      description: r.description || "",
      defaultUnit: r.defaultUnit || "TRIP",
      pricingType: r.pricingType || "ROUTE_BASED",
      isCoreTransport: Boolean(r.isCoreTransport),
      isActive: Boolean(r.isActive),
      sortOrder: Number(r.sortOrder || 0),
      typicalCharges: Array.isArray(r.typicalCharges)
        ? r.typicalCharges
        : typeof r.typicalCharges === "string"
        ? JSON.parse(r.typicalCharges)
        : [],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Lỗi truy vấn cơ sở dữ liệu dịch vụ");
  }
}

export interface SaveServicePackageInput {
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  description?: string;
  defaultUnit: string;
  pricingType: "ROUTE_BASED" | "UNIT_BASED";
  isCoreTransport?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  typicalCharges?: string[];
}

/**
 * Cập nhật gói dịch vụ
 */
export async function saveServicePackage(
  input: SaveServicePackageInput,
  actor: CurrentActor
): Promise<MasterServicePackage> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);

  const serviceId = input.serviceId.trim().toUpperCase();
  const serviceName = input.serviceName.trim();
  const serviceCategory = input.serviceCategory.trim();
  const description = (input.description || "").trim();
  const defaultUnit = input.defaultUnit.trim().toUpperCase() || "TRIP";
  const pricingType = input.pricingType;
  const isCoreTransport = Boolean(input.isCoreTransport);
  const isActive = input.isActive !== false;
  const sortOrder = Number(input.sortOrder || 0);
  const typicalCharges = input.typicalCharges || [];

  if (!serviceId) throw new Error("Mã dịch vụ không được để trống.");
  if (!serviceName) throw new Error("Tên dịch vụ không được để trống.");

  await ensureServicesTable();

  const query = `
    INSERT INTO services (
      service_id, service_name, service_category, description,
      default_unit, pricing_type, is_core_transport, is_active,
      sort_order, typical_charges, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
    ON CONFLICT (service_id) DO UPDATE SET
      service_name = EXCLUDED.service_name,
      service_category = EXCLUDED.service_category,
      description = EXCLUDED.description,
      default_unit = EXCLUDED.default_unit,
      pricing_type = EXCLUDED.pricing_type,
      is_core_transport = EXCLUDED.is_core_transport,
      is_active = EXCLUDED.is_active,
      sort_order = EXCLUDED.sort_order,
      typical_charges = EXCLUDED.typical_charges,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    serviceId,
    serviceName,
    serviceCategory,
    description,
    defaultUnit,
    pricingType,
    isCoreTransport,
    isActive,
    sortOrder,
    JSON.stringify(typicalCharges),
  ]);

  const r = rows[0];
  if (!r) throw new Error("Không thể lưu gói dịch vụ vào cơ sở dữ liệu.");

  return {
    serviceId: r.service_id,
    serviceName: r.service_name,
    serviceCategory: r.service_category,
    categoryName: CATEGORY_NAME_MAP[r.service_category] || r.service_category,
    description: r.description || "",
    defaultUnit: r.default_unit || "TRIP",
    pricingType: r.pricing_type || "ROUTE_BASED",
    isCoreTransport: Boolean(r.is_core_transport),
    isActive: Boolean(r.is_active),
    sortOrder: Number(r.sort_order || 0),
    typicalCharges: Array.isArray(r.typical_charges)
      ? r.typical_charges
      : typeof r.typical_charges === "string"
      ? JSON.parse(r.typical_charges)
      : [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/**
 * Đổi trạng thái Hoạt động / Tạm dừng dịch vụ
 */
export async function toggleServiceStatus(
  serviceId: string,
  isActive: boolean,
  actor: CurrentActor
): Promise<void> {
  requireRole(actor, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]);
  await ensureServicesTable();
  await pool.query("UPDATE services SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE service_id = $2", [
    isActive,
    serviceId,
  ]);
}

