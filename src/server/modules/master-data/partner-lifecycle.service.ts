import { pool } from "@/server/db";
import { CurrentActor } from "@/server/auth/types";
import { requireRole } from "@/server/auth/authorize";

export interface PartnerDirectoryItem {
  partnerId: string;
  partnerName: string;
  shortName?: string;
  taxCode?: string;
  country?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: "ACTIVE" | "INACTIVE";
  sourcePartnerType?: string;
  // Customer Role info
  isCustomer: boolean;
  customerRoleStatus?: "PENDING" | "ACTIVE" | "SUSPENDED" | "NONE";
  paymentTermsDays?: number;
  creditLimitVnd?: number | null;
  customerActivatedBy?: string;
  customerActivatedAt?: string;
  // Vendor Role info
  isVendor: boolean;
  vendorRoleStatus?: "PENDING" | "ACTIVE" | "SUSPENDED" | "NONE";
  vendorType?: string;
  createdAt: string;
}

export interface PartnerRoleAuditItem {
  logId: string;
  partnerId: string;
  roleType: "CUSTOMER" | "VENDOR";
  action: string;
  actorId: string;
  actorName?: string;
  previousStatus?: string;
  newStatus?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Tra cứu Danh mục Đối tác tổng hợp (Partners Directory) kèm trạng thái vai trò Customer / Vendor
 */
export async function getPartnersDirectory(filters?: {
  search?: string;
  roleFilter?: "ALL" | "CUSTOMER" | "VENDOR" | "NO_ROLE";
  status?: string;
  limit?: number;
}): Promise<PartnerDirectoryItem[]> {
  let query = `
    SELECT 
      p.partner_id as "partnerId",
      p.partner_name as "partnerName",
      p.short_name as "shortName",
      p.tax_code as "taxCode",
      p.country,
      p.address,
      p.phone,
      p.email,
      p.status,
      p.source_partner_type as "sourcePartnerType",
      p.created_at as "createdAt",
      -- Customer Role
      c.customer_id IS NOT NULL as "isCustomer",
      COALESCE(c.role_status, 'NONE') as "customerRoleStatus",
      c.payment_terms_days as "paymentTermsDays",
      c.credit_limit_vnd as "creditLimitVnd",
      c.activated_by as "customerActivatedBy",
      c.activated_at as "customerActivatedAt",
      -- Vendor Role
      v.vendor_id IS NOT NULL as "isVendor",
      COALESCE(v.role_status, 'NONE') as "vendorRoleStatus",
      v.vendor_type as "vendorType"
    FROM partners p
    LEFT JOIN customers c ON p.partner_id = c.customer_id
    LEFT JOIN vendors v ON p.partner_id = v.vendor_id
    WHERE 1=1
  `;

  const params: unknown[] = [];

  if (filters?.search && filters.search.trim()) {
    params.push(`%${filters.search.trim()}%`);
    query += ` AND (p.partner_name ILIKE $${params.length} OR p.short_name ILIKE $${params.length} OR p.tax_code ILIKE $${params.length} OR p.partner_id ILIKE $${params.length})`;
  }

  if (filters?.status && filters.status !== "ALL") {
    params.push(filters.status);
    query += ` AND p.status = $${params.length}`;
  }

  if (filters?.roleFilter === "CUSTOMER") {
    query += ` AND c.customer_id IS NOT NULL`;
  } else if (filters?.roleFilter === "VENDOR") {
    query += ` AND v.vendor_id IS NOT NULL`;
  } else if (filters?.roleFilter === "NO_ROLE") {
    query += ` AND c.customer_id IS NULL AND v.vendor_id IS NULL`;
  }

  const limit = filters?.limit ?? 300;
  params.push(limit);
  query += ` ORDER BY p.partner_name ASC LIMIT $${params.length}`;

  const { rows } = await pool.query(query, params);
  return rows.map((r) => ({
    partnerId: r.partnerId,
    partnerName: r.partnerName,
    shortName: r.shortName || undefined,
    taxCode: r.taxCode || undefined,
    country: r.country || "Việt Nam",
    address: r.address || undefined,
    phone: r.phone || undefined,
    email: r.email || undefined,
    status: r.status,
    sourcePartnerType: r.sourcePartnerType || undefined,
    isCustomer: Boolean(r.isCustomer),
    customerRoleStatus: r.customerRoleStatus,
    paymentTermsDays: r.paymentTermsDays ? Number(r.paymentTermsDays) : 30,
    creditLimitVnd: r.creditLimitVnd != null ? Number(r.creditLimitVnd) : null,
    customerActivatedBy: r.customerActivatedBy || undefined,
    customerActivatedAt: r.customerActivatedAt ? new Date(r.customerActivatedAt).toISOString() : undefined,
    isVendor: Boolean(r.isVendor),
    vendorRoleStatus: r.vendorRoleStatus,
    vendorType: r.vendorType || undefined,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
  }));
}

/**
 * Kích hoạt vai trò Khách hàng (Customer Role Activation)
 * Quyền yêu cầu: ADMIN, PRICING_MANAGER, DIRECTOR
 * Thực thi transaction an toàn với row locking (SELECT ... FOR UPDATE)
 */
export async function activateCustomerRole(
  input: {
    partnerId: string;
    paymentTermsDays?: number;
    creditLimitVnd?: number | null;
    comment?: string;
  },
  actor: CurrentActor
) {
  requireRole(actor, ["ADMIN", "PRICING_MANAGER", "DIRECTOR"]);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Lock đối tác để tránh race-condition
    const partnerRes = await client.query(
      `SELECT partner_id, partner_name, status FROM partners WHERE partner_id = $1 FOR UPDATE`,
      [input.partnerId]
    );

    if (partnerRes.rows.length === 0) {
      throw new Error(`Đối tác có mã [${input.partnerId}] không tồn tại trong hệ thống.`);
    }

    const partner = partnerRes.rows[0];
    if (partner.status !== "ACTIVE") {
      throw new Error(
        `Đối tác [${partner.partner_name}] hiện ở trạng thái ${partner.status}, không đủ điều kiện kích hoạt vai trò Khách hàng.`
      );
    }

    // 2. Tra cứu trạng thái vai trò trước đó nếu đã có
    const prevRes = await client.query(
      `SELECT role_status FROM customers WHERE customer_id = $1`,
      [input.partnerId]
    );
    const previousStatus = prevRes.rows.length > 0 ? prevRes.rows[0].role_status : "NONE";

    const paymentTerms = input.paymentTermsDays !== undefined ? Math.max(0, input.paymentTermsDays) : 30;
    // Phân biệt rõ ràng: null = Chưa cấp hạn mức, 0 = Không cấp nợ / Trả trước, >0 = Hạn mức được cấp
    const creditLimit = (input.creditLimitVnd === null || input.creditLimitVnd === undefined) ? null : Math.max(0, input.creditLimitVnd);

    // 3. Upsert Customer Role record
    await client.query(
      `INSERT INTO customers (
         customer_id, role_status, payment_terms_days, credit_limit_vnd,
         activated_by, activated_at, updated_at
       ) VALUES (
         $1, 'ACTIVE', $2, $3,
         $4, NOW(), NOW()
       ) ON CONFLICT (customer_id) DO UPDATE SET
         role_status = 'ACTIVE',
         payment_terms_days = COALESCE(EXCLUDED.payment_terms_days, customers.payment_terms_days),
         credit_limit_vnd = EXCLUDED.credit_limit_vnd,
         activated_by = EXCLUDED.activated_by,
         activated_at = EXCLUDED.activated_at,
         updated_at = NOW();`,
      [
        input.partnerId,
        paymentTerms,
        creditLimit,
        actor.userId,
      ]
    );

    // 4. Ghi Audit Log sự kiện
    await client.query(
      `INSERT INTO partner_role_audit_log (
         partner_id, role_type, action, actor_id, actor_name,
         previous_status, new_status, details
       ) VALUES ($1, 'CUSTOMER', 'ACTIVATE', $2, $3, $4, 'ACTIVE', $5);`,
      [
        input.partnerId,
        actor.userId,
        actor.fullName,
        previousStatus,
        JSON.stringify({
          comment: input.comment || `Kích hoạt vai trò Khách hàng bởi [${actor.fullName} - ${actor.role}]`,
          paymentTermsDays: paymentTerms,
          creditLimitVnd: creditLimit,
        }),
      ]
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: `Đã kích hoạt vai trò Khách hàng (Customer Role: ACTIVE) thành công cho [${partner.partner_name}].`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Tạm ngừng vai trò Khách hàng (Suspend Customer Role)
 * Quyền yêu cầu: ADMIN, PRICING_MANAGER, DIRECTOR
 */
export async function suspendCustomerRole(
  input: {
    partnerId: string;
    reason: string;
  },
  actor: CurrentActor
) {
  requireRole(actor, ["ADMIN", "PRICING_MANAGER", "DIRECTOR"]);

  if (!input.reason || input.reason.trim().length < 3) {
    throw new Error("Bắt buộc phải nhập Lý do tạm ngừng vai trò Khách hàng (tối thiểu 3 ký tự) để phục vụ kiểm toán.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const custRes = await client.query(
      `SELECT c.customer_id, c.role_status, p.partner_name
       FROM customers c
       JOIN partners p ON c.customer_id = p.partner_id
       WHERE c.customer_id = $1 FOR UPDATE`,
      [input.partnerId]
    );

    if (custRes.rows.length === 0) {
      throw new Error(`Hồ sơ Khách hàng có mã [${input.partnerId}] không tồn tại.`);
    }

    const currentCustomer = custRes.rows[0];
    const previousStatus = currentCustomer.role_status;

    await client.query(
      `UPDATE customers 
       SET role_status = 'SUSPENDED', updated_at = NOW() 
       WHERE customer_id = $1`,
      [input.partnerId]
    );

    await client.query(
      `INSERT INTO partner_role_audit_log (
         partner_id, role_type, action, actor_id, actor_name,
         previous_status, new_status, details
       ) VALUES ($1, 'CUSTOMER', 'SUSPEND', $2, $3, $4, 'SUSPENDED', $5);`,
      [
        input.partnerId,
        actor.userId,
        actor.fullName,
        previousStatus,
        JSON.stringify({
          reason: input.reason.trim(),
          suspendedBy: `${actor.fullName} (${actor.role})`,
        }),
      ]
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: `Đã tạm ngừng vai trò Khách hàng (SUSPENDED) của [${currentCustomer.partner_name}]. Đối tác sẽ không xuất hiện trong danh sách lập báo giá mới.`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Đề nghị kích hoạt vai trò Khách hàng (Dành cho Sales / Operations đề xuất)
 */
export async function requestCustomerRoleActivation(
  partnerId: string,
  actor: CurrentActor
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const partnerRes = await client.query(
      `SELECT partner_id, partner_name, status FROM partners WHERE partner_id = $1`,
      [partnerId]
    );

    if (partnerRes.rows.length === 0) {
      throw new Error(`Đối tác [${partnerId}] không tồn tại.`);
    }

    const partner = partnerRes.rows[0];

    const custRes = await client.query(
      `SELECT role_status FROM customers WHERE customer_id = $1`,
      [partnerId]
    );

    if (custRes.rows.length > 0 && custRes.rows[0].role_status === "ACTIVE") {
      await client.query("COMMIT");
      return {
        success: true,
        message: `Đối tác [${partner.partner_name}] đã có vai trò Khách hàng ACTIVE từ trước.`,
      };
    }

    const prevStatus = custRes.rows.length > 0 ? custRes.rows[0].role_status : "NONE";

    await client.query(
      `INSERT INTO customers (customer_id, role_status, payment_terms_days, updated_at)
       VALUES ($1, 'PENDING', 30, NOW())
       ON CONFLICT (customer_id) DO UPDATE SET
         role_status = 'PENDING',
         updated_at = NOW();`,
      [partnerId]
    );

    await client.query(
      `INSERT INTO partner_role_audit_log (
         partner_id, role_type, action, actor_id, actor_name,
         previous_status, new_status, details
       ) VALUES ($1, 'CUSTOMER', 'REQUEST_ACTIVATION', $2, $3, $4, 'PENDING', $5);`,
      [
        partnerId,
        actor.userId,
        actor.fullName,
        prevStatus,
        JSON.stringify({
          requestedBy: `${actor.fullName} (${actor.role})`,
        }),
      ]
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: `Đã gửi đề nghị kích hoạt vai trò Khách hàng (PENDING) cho [${partner.partner_name}]. Quản lý Định giá / Admin sẽ xét duyệt.`,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Cập nhật Điều khoản Thương mại & Hạn mức Tín dụng Khách hàng
 */
export async function updateCustomerRoleTerms(
  input: {
    partnerId: string;
    paymentTermsDays: number;
    creditLimitVnd?: number | null;
  },
  actor: CurrentActor
) {
  requireRole(actor, ["ADMIN", "PRICING_MANAGER", "DIRECTOR"]);

  const terms = Math.max(0, input.paymentTermsDays);
  const limit = (input.creditLimitVnd === null || input.creditLimitVnd === undefined) ? null : Math.max(0, input.creditLimitVnd);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE customers
       SET payment_terms_days = $2, credit_limit_vnd = $3, updated_at = NOW()
       WHERE customer_id = $1`,
      [input.partnerId, terms, limit]
    );

    await client.query(
      `INSERT INTO partner_role_audit_log (
         partner_id, role_type, action, actor_id, actor_name, details
       ) VALUES ($1, 'CUSTOMER', 'UPDATE_TERMS', $2, $3, $4);`,
      [
        input.partnerId,
        actor.userId,
        actor.fullName,
        JSON.stringify({
          paymentTermsDays: terms,
          creditLimitVnd: limit,
          updatedBy: `${actor.fullName} (${actor.role})`,
        }),
      ]
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: "Đã cập nhật Điều khoản Thương mại và Hạn mức Tín dụng thành công.",
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Lấy lịch sử Audit sự kiện của vai trò Đối tác
 */
export async function getPartnerRoleAuditHistory(partnerId: string): Promise<PartnerRoleAuditItem[]> {
  const { rows } = await pool.query(
    `SELECT 
       log_id as "logId",
       partner_id as "partnerId",
       role_type as "roleType",
       action,
       actor_id as "actorId",
       actor_name as "actorName",
       previous_status as "previousStatus",
       new_status as "newStatus",
       details,
       created_at as "createdAt"
     FROM partner_role_audit_log
     WHERE partner_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [partnerId]
  );

  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
  }));
}
