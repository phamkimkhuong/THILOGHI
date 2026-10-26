import { getSessionActor } from "./session";
import { CurrentActor, AuthorizationError, UserRole } from "./types";

/**
 * Xác thực danh tính người dùng bắt buộc từ Session JWT
 */
export async function requireAuth(): Promise<CurrentActor> {
  const actor = await getSessionActor();
  if (!actor || !actor.userId) {
    throw new AuthorizationError("Yêu cầu đăng nhập: Phiên làm việc không hợp lệ hoặc đã hết hạn.");
  }
  return actor;
}

/**
 * Kiểm tra và ràng buộc phân quyền theo Phân vùng (Region Scope Guard)
 * Nguyên tắc P0.2: Không cho phép Sales/Pricing thao tác trên phân vùng ngoài phạm vi được giao
 */
export function requireRegionScope(actor: CurrentActor, targetRegionId: string): void {
  // Toàn quyền nếu có ký tự đại diện "*" (Ban Lãnh Đạo / Admin)
  if (actor.regionScopes.includes("*")) {
    return;
  }

  if (!actor.regionScopes.includes(targetRegionId)) {
    throw new AuthorizationError(
      `Từ chối truy cập (403 Forbidden): Người dùng [${actor.fullName}] không có quyền thao tác trên Phân vùng [${targetRegionId}]. Phạm vi cho phép của bạn: [${actor.regionScopes.join(", ")}].`
    );
  }
}

/**
 * Kiểm tra vai trò người dùng (Role-Based Access Control - RBAC)
 */
export function requireRole(actor: CurrentActor, allowedRoles: UserRole[]): void {
  if (actor.role === "DIRECTOR" || actor.role === "ADMIN") {
    return;
  }

  if (!allowedRoles.includes(actor.role)) {
    throw new AuthorizationError(
      `Từ chối thao tác: Vai trò [${actor.role}] của bạn không có thẩm quyền thực hiện tác vụ này. Yêu cầu: [${allowedRoles.join(", ")}].`
    );
  }
}
