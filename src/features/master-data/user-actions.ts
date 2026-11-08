"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/server/auth/authorize";
import {
  getUsersDetailedList,
  saveUserService,
  toggleUserStatusService,
  resetUserPasswordService,
  type UserItem,
  type SaveUserInput,
} from "@/server/modules/master-data/master-data.service";

export type { UserItem, SaveUserInput };

export async function getUsersAction(filters?: {
  search?: string;
  role?: string;
  status?: string;
  regionScope?: string;
}) {
  try {
    const actor = await requireAuth();
    requireRole(actor, ["ADMIN", "DIRECTOR"]);

    const list = await getUsersDetailedList(filters);
    return { success: true as const, data: list };
  } catch (err) {
    return {
      success: false as const,
      data: [] as UserItem[],
      error: err instanceof Error ? err.message : "Lỗi khi tải danh sách người dùng",
    };
  }
}

export async function saveUserAction(input: SaveUserInput) {
  try {
    const actor = await requireAuth();
    const res = await saveUserService(input, actor);
    revalidatePath("/master/users");
    return { success: true as const, data: res.user, message: res.message };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Lỗi khi lưu thông tin người dùng",
    };
  }
}

export async function toggleUserStatusAction(userId: string) {
  try {
    const actor = await requireAuth();
    const res = await toggleUserStatusService(userId, actor);
    revalidatePath("/master/users");
    return { success: true as const, isActive: res.isActive, message: res.message };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Lỗi khi chuyển trạng thái người dùng",
    };
  }
}

export async function resetUserPasswordAction(userId: string, newPassword: string) {
  try {
    const actor = await requireAuth();
    const res = await resetUserPasswordService(userId, newPassword, actor);
    revalidatePath("/master/users");
    return { success: true as const, message: res.message };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Lỗi khi đặt lại mật khẩu",
    };
  }
}
