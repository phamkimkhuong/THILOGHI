import { db } from "@/server/db";
import {
  regions,
  customers,
  partners,
  locations,
  commodities,
  vendors,
} from "@/server/db/schema";
import { eq, and, asc, ilike, or } from "drizzle-orm";

export interface MasterOption {
  id: string;
  code?: string;
  name: string;
  extra?: Record<string, unknown>;
}

export const EQUIPMENT_TYPES = [
  { id: "40HC", name: "Container 40' Cao (40HC)" },
  { id: "40RH", name: "Container 40' Lạnh (40RH)" },
  { id: "20DC", name: "Container 20' Tiêu chuẩn (20DC)" },
  { id: "20RF", name: "Container 20' Lạnh (20RF)" },
  { id: "TRUCK_15T", name: "Xe tải thùng 15 Tấn" },
  { id: "TRUCK_FO", name: "Xe bồn chuyên dụng chất lỏng" },
  { id: "RMS", name: "Rơ moóc sàn (RMS)" },
  { id: "General", name: "Phương tiện đa dụng (General)" },
];

/**
 * Lấy danh sách Phân vùng nghiệp vụ thực tế từ PostgreSQL (regions) qua Drizzle ORM
 * Fail-Closed: Tuyệt đối không dùng dữ liệu giả/fallback
 */
export async function getMasterRegions(): Promise<MasterOption[]> {
  const rows = await db
    .select({
      id: regions.regionId,
      name: regions.name,
      code: regions.scope,
    })
    .from(regions)
    .orderBy(asc(regions.regionId));

  return rows;
}

/**
 * Lấy danh sách Khách hàng thực tế từ PostgreSQL (customers role + partners identity) qua Drizzle ORM
 * Chỉ hiển thị đối tác có Customer Role ACTIVE và Partner ACTIVE
 */
export async function getMasterCustomers(): Promise<MasterOption[]> {
  const rows = await db
    .select({
      id: customers.customerId,
      name: partners.partnerName,
      code: partners.taxCode,
    })
    .from(customers)
    .innerJoin(partners, eq(customers.customerId, partners.partnerId))
    .where(and(eq(customers.roleStatus, "ACTIVE"), eq(partners.status, "ACTIVE")))
    .orderBy(asc(partners.partnerName));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code || undefined,
  }));
}

/**
 * Lấy danh sách Địa điểm, Cảng, Depot, Cửa khẩu thực tế từ PostgreSQL (locations) qua Drizzle ORM
 */
export async function getMasterLocations(): Promise<MasterOption[]> {
  const rows = await db
    .select({
      id: locations.locationId,
      name: locations.name,
      code: locations.code,
      type: locations.locationType,
      regionId: locations.regionId,
    })
    .from(locations)
    .where(eq(locations.isActive, true))
    .orderBy(asc(locations.name));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    extra: { type: r.type, regionId: r.regionId },
  }));
}

/**
 * Lấy danh sách Mặt hàng thực tế từ PostgreSQL (commodities) qua Drizzle ORM
 */
export async function getMasterCommodities(): Promise<MasterOption[]> {
  const rows = await db
    .select({
      id: commodities.commodityId,
      name: commodities.name,
      code: commodities.category,
    })
    .from(commodities)
    .orderBy(asc(commodities.name));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code || undefined,
  }));
}

/**
 * Lấy danh sách Nhà cung cấp / Đội xe thực tế từ PostgreSQL (vendors role + partners identity) qua Drizzle ORM
 * Chỉ hiển thị đối tác có Vendor Role ACTIVE và Partner ACTIVE
 */
export async function getMasterVendors(): Promise<MasterOption[]> {
  const rows = await db
    .select({
      id: vendors.vendorId,
      name: partners.partnerName,
      code: partners.taxCode,
      type: vendors.vendorType,
    })
    .from(vendors)
    .innerJoin(partners, eq(vendors.vendorId, partners.partnerId))
    .where(and(eq(vendors.roleStatus, "ACTIVE"), eq(partners.status, "ACTIVE")))
    .orderBy(asc(partners.partnerName));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code || undefined,
    extra: { type: r.type },
  }));
}

/**
 * Lấy danh sách khách hàng từ customers (role) JOIN partners (identity) qua Drizzle ORM
 */
export async function getCustomersDetailedList(filters?: { search?: string }) {
  const baseQuery = db
    .select({
      customerId: customers.customerId,
      customerName: partners.partnerName,
      shortName: partners.shortName,
      taxCode: partners.taxCode,
      address: partners.address,
      phone: partners.phone,
      email: partners.email,
      paymentTermsDays: customers.paymentTermsDays,
      creditLimit: customers.creditLimitVnd,
      status: customers.roleStatus,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .innerJoin(partners, eq(customers.customerId, partners.partnerId));

  const trimmed = filters?.search?.trim();
  if (trimmed) {
    const pattern = `%${trimmed}%`;
    return await baseQuery
      .where(
        or(
          ilike(partners.partnerName, pattern),
          ilike(partners.shortName, pattern),
          ilike(partners.taxCode, pattern)
        )
      )
      .orderBy(asc(partners.partnerName))
      .limit(300);
  }

  return await baseQuery.orderBy(asc(partners.partnerName)).limit(300);
}

/**
 * Lấy danh sách nhà cung cấp từ vendors (role) JOIN partners (identity) qua Drizzle ORM
 */
export async function getVendorsDetailedList(filters?: { search?: string }) {
  const baseQuery = db
    .select({
      vendorId: vendors.vendorId,
      vendorName: partners.partnerName,
      vendorType: vendors.vendorType,
      taxCode: partners.taxCode,
      phone: partners.phone,
      email: partners.email,
      status: vendors.roleStatus,
      createdAt: vendors.createdAt,
    })
    .from(vendors)
    .innerJoin(partners, eq(vendors.vendorId, partners.partnerId));

  const trimmed = filters?.search?.trim();
  if (trimmed) {
    const pattern = `%${trimmed}%`;
    return await baseQuery
      .where(
        or(
          ilike(partners.partnerName, pattern),
          ilike(partners.taxCode, pattern),
          ilike(vendors.vendorType, pattern)
        )
      )
      .orderBy(asc(partners.partnerName))
      .limit(200);
  }

  return await baseQuery.orderBy(asc(partners.partnerName)).limit(200);
}
