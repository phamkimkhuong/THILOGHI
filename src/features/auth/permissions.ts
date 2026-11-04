import { UserRole } from "@/server/auth/types";

export type PermissionAction =
  | "QUOTATION_CREATE"
  | "QUOTATION_EDIT"
  | "QUOTATION_APPROVE"
  | "QUOTATION_REJECT"
  | "QUOTATION_RETURN_DRAFT"
  | "QUOTATION_CREATE_VERSION"
  | "MASTER_DATA_MANAGE"
  | "RATES_MANAGE"
  | "CUSTOMERS_MANAGE";

export const PERMISSION_MATRIX: Record<PermissionAction, UserRole[]> = {
  QUOTATION_CREATE: ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST", "SALES"],
  QUOTATION_EDIT: ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST", "SALES"],
  QUOTATION_APPROVE: ["ADMIN", "DIRECTOR", "PRICING_MANAGER"],
  QUOTATION_REJECT: ["ADMIN", "DIRECTOR", "PRICING_MANAGER"],
  QUOTATION_RETURN_DRAFT: ["ADMIN", "DIRECTOR", "PRICING_MANAGER"],
  QUOTATION_CREATE_VERSION: ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST", "SALES"],
  MASTER_DATA_MANAGE: ["ADMIN", "DIRECTOR", "PRICING_MANAGER"],
  RATES_MANAGE: ["ADMIN", "DIRECTOR", "PRICING_MANAGER"],
  CUSTOMERS_MANAGE: ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "SALES"],
};

/**
 * Kiểm tra xem một vai trò có quyền thực hiện hành động cụ thể hay không.
 */
export function hasPermission(
  role: UserRole | string | undefined | null,
  action: PermissionAction
): boolean {
  if (!role) return false;
  const allowed = PERMISSION_MATRIX[action];
  return allowed.includes(role as UserRole);
}

/**
 * Kiểm tra xem một vai trò có nằm trong danh sách các vai trò cho phép hay không.
 */
export function hasAnyRole(
  role: UserRole | string | undefined | null,
  roles: (UserRole | string)[]
): boolean {
  if (!role) return false;
  return roles.includes(role);
}

