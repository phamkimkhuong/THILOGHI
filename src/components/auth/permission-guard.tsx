"use client";

import React, { ReactNode } from "react";
import { UserRole } from "@/server/auth/types";
import { PermissionAction, hasPermission, hasAnyRole } from "@/features/auth/permissions";

export interface PermissionContextActor {
  role?: UserRole | string;
  userId?: string;
  fullName?: string;
}

export function usePermission(actor?: PermissionContextActor | null) {
  const role = actor?.role;

  return {
    role,
    can: (action: PermissionAction) => hasPermission(role, action),
    hasRole: (...roles: (UserRole | string)[]) => hasAnyRole(role, roles),
    isManager: hasAnyRole(role, ["ADMIN", "DIRECTOR", "PRICING_MANAGER"]),
    isCommercial: hasAnyRole(role, ["ADMIN", "DIRECTOR", "PRICING_MANAGER", "PRICING_SPECIALIST", "SALES"]),
  };
}

interface CanProps {
  actor?: PermissionContextActor | null;
  action?: PermissionAction;
  roles?: (UserRole | string)[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Component hiển thị có điều kiện dựa trên thẩm quyền (RBAC UI Guard).
 * Ví dụ:
 * <Can actor={actor} action="QUOTATION_APPROVE">
 *   <button>Duyệt báo giá</button>
 * </Can>
 */
export function Can({ actor, action, roles, fallback = null, children }: CanProps) {
  const { can, hasRole } = usePermission(actor);

  if (action && !can(action)) {
    return <>{fallback}</>;
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

