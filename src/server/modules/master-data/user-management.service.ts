import { hash } from "bcryptjs";
import { db } from "@/server/db";
import { users, masterDataAudit } from "@/server/db/schema";
import { eq, asc, desc, and, or, ilike } from "drizzle-orm";
import { requireRole } from "@/server/auth/authorize";
import type { CurrentActor, UserRole } from "@/server/auth/types";

export interface UserItem {
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
  regionScopes: string[];
  email: string | null;
  company: string | null;
  department: string | null;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SaveUserInput {
  userId?: string;
  username: string;
  fullName: string;
  password?: string;
  role: UserRole;
  regionScopes: string[];
  email?: string | null;
  company?: string | null;
  department?: string | null;
  isActive?: boolean;
}

export async function getUsersDetailedList(filters?: {
  search?: string;
  role?: string;
  status?: string;
  regionScope?: string;
}): Promise<UserItem[]> {
  const base = db
    .select({
      userId: users.userId,
      username: users.username,
      fullName: users.fullName,
      role: users.role,
      regionScopes: users.regionScopes,
      email: users.email,
      company: users.company,
      department: users.department,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users);

  const conditions = [];

  if (filters?.role && filters.role !== "ALL") {
    conditions.push(eq(users.role, filters.role));
  }

  if (filters?.status === "ACTIVE") {
    conditions.push(eq(users.isActive, true));
  } else if (filters?.status === "INACTIVE") {
    conditions.push(eq(users.isActive, false));
  }

  if (filters?.search?.trim()) {
    const pattern = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(users.fullName, pattern),
        ilike(users.username, pattern),
        ilike(users.email, pattern),
        ilike(users.department, pattern),
        ilike(users.company, pattern)
      )
    );
  }

  const query = conditions.length > 0 ? base.where(and(...conditions)) : base;
  const rows = await query.orderBy(desc(users.isActive), asc(users.role), asc(users.fullName)).limit(300);

  return rows.map((r) => ({
    userId: r.userId,
    username: r.username,
    fullName: r.fullName,
    role: r.role as UserRole,
    regionScopes: Array.isArray(r.regionScopes) ? r.regionScopes : [r.regionScopes],
    email: r.email,
    company: r.company,
    department: r.department,
    isActive: r.isActive ?? true,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function saveUserService(
  input: SaveUserInput,
  actor: CurrentActor
): Promise<{ success: boolean; message: string; user: UserItem }> {
  requireRole(actor, ["ADMIN", "DIRECTOR"]);

  const username = input.username.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const email = (input.email || "").trim() || null;
  const company = (input.company || "").trim() || null;
  const department = (input.department || "").trim() || null;
  const regionScopes = input.regionScopes && input.regionScopes.length > 0 ? input.regionScopes : ["*"];
  const isActive = input.isActive !== false;

  if (!username) throw new Error("Tên đăng nhập không được để trống.");
  if (!fullName) throw new Error("Họ và tên không được để trống.");
  if (!input.role) throw new Error("Vui lòng chọn vai trò cho người dùng.");

  if (input.userId) {
    // Cập nhật người dùng hiện tại
    const [existing] = await db.select().from(users).where(eq(users.userId, input.userId)).limit(1);
    if (!existing) {
      throw new Error(`Người dùng [${input.userId}] không tồn tại.`);
    }

    // Kiểm tra trùng username nếu đổi tên
    if (existing.username !== username) {
      const [dup] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (dup) throw new Error(`Tên đăng nhập [${username}] đã được sử dụng.`);
    }

    // Bảo vệ tự khóa tài khoản Admin/Director của chính mình
    if (existing.userId === actor.userId && !isActive) {
      throw new Error("Không thể tự vô hiệu hóa tài khoản quản trị của chính bạn.");
    }

    let passwordHashToUpdate = existing.passwordHash;
    if (input.password && input.password.trim()) {
      if (input.password.trim().length < 6) {
        throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      }
      passwordHashToUpdate = await hash(input.password.trim(), 10);
    }

    const [updated] = await db
      .update(users)
      .set({
        username,
        fullName,
        passwordHash: passwordHashToUpdate,
        role: input.role,
        regionScopes,
        email,
        company,
        department,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.userId, input.userId))
      .returning();

    // Ghi audit log
    await db.insert(masterDataAudit).values({
      entityType: "users",
      entityId: input.userId,
      action: "UPDATE",
      actorId: actor.userId,
      actorName: actor.fullName,
      beforeData: existing,
      afterData: updated,
      comment: `Cập nhật thông tin tài khoản [${username}]`,
    });

    return {
      success: true,
      message: `Đã cập nhật tài khoản [${fullName}] thành công.`,
      user: {
        userId: updated.userId,
        username: updated.username,
        fullName: updated.fullName,
        role: updated.role as UserRole,
        regionScopes: updated.regionScopes,
        email: updated.email,
        company: updated.company,
        department: updated.department,
        isActive: updated.isActive ?? true,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    };
  } else {
    // Tạo mới người dùng
    const [dup] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (dup) throw new Error(`Tên đăng nhập [${username}] đã tồn tại trong hệ thống.`);

    const passwordRaw = (input.password || "").trim();
    if (!passwordRaw || passwordRaw.length < 6) {
      throw new Error("Mật khẩu khởi tạo phải có ít nhất 6 ký tự.");
    }
    const passwordHash = await hash(passwordRaw, 10);
    const newUserId = `USR_${username.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;

    const [created] = await db
      .insert(users)
      .values({
        userId: newUserId,
        username,
        fullName,
        passwordHash,
        role: input.role,
        regionScopes,
        email,
        company,
        department,
        isActive,
      })
      .returning();

    // Ghi audit log
    await db.insert(masterDataAudit).values({
      entityType: "users",
      entityId: newUserId,
      action: "CREATE",
      actorId: actor.userId,
      actorName: actor.fullName,
      beforeData: null,
      afterData: created,
      comment: `Khởi tạo tài khoản người dùng mới [${username}]`,
    });

    return {
      success: true,
      message: `Đã tạo mới tài khoản [${fullName}] thành công.`,
      user: {
        userId: created.userId,
        username: created.username,
        fullName: created.fullName,
        role: created.role as UserRole,
        regionScopes: created.regionScopes,
        email: created.email,
        company: created.company,
        department: created.department,
        isActive: created.isActive ?? true,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    };
  }
}

export async function toggleUserStatusService(
  targetUserId: string,
  actor: CurrentActor
): Promise<{ success: boolean; isActive: boolean; message: string }> {
  requireRole(actor, ["ADMIN", "DIRECTOR"]);

  if (targetUserId === actor.userId) {
    throw new Error("Không thể tự vô hiệu hóa tài khoản của chính bạn.");
  }

  const [existing] = await db.select().from(users).where(eq(users.userId, targetUserId)).limit(1);
  if (!existing) {
    throw new Error(`Người dùng [${targetUserId}] không tồn tại.`);
  }

  const nextActive = !existing.isActive;

  const [updated] = await db
    .update(users)
    .set({
      isActive: nextActive,
      updatedAt: new Date(),
    })
    .where(eq(users.userId, targetUserId))
    .returning();

  await db.insert(masterDataAudit).values({
    entityType: "users",
    entityId: targetUserId,
    action: "TOGGLE_STATUS",
    actorId: actor.userId,
    actorName: actor.fullName,
    beforeData: existing,
    afterData: updated,
    comment: `Chuyển trạng thái tài khoản [${existing.username}] sang ${nextActive ? "Active" : "Locked"}`,
  });

  return {
    success: true,
    isActive: nextActive,
    message: `Đã ${nextActive ? "kích hoạt lại" : "tạm khóa"} tài khoản [${existing.fullName}].`,
  };
}

export async function resetUserPasswordService(
  targetUserId: string,
  newPasswordRaw: string,
  actor: CurrentActor
): Promise<{ success: boolean; message: string }> {
  requireRole(actor, ["ADMIN", "DIRECTOR"]);

  const password = newPasswordRaw.trim();
  if (!password || password.length < 6) {
    throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");
  }

  const [existing] = await db.select().from(users).where(eq(users.userId, targetUserId)).limit(1);
  if (!existing) {
    throw new Error(`Người dùng [${targetUserId}] không tồn tại.`);
  }

  const newHash = await hash(password, 10);

  await db
    .update(users)
    .set({
      passwordHash: newHash,
      updatedAt: new Date(),
    })
    .where(eq(users.userId, targetUserId));

  await db.insert(masterDataAudit).values({
    entityType: "users",
    entityId: targetUserId,
    action: "RESET_PASSWORD",
    actorId: actor.userId,
    actorName: actor.fullName,
    beforeData: null,
    afterData: null,
    comment: `Đặt lại mật khẩu cho tài khoản [${existing.username}]`,
  });

  return {
    success: true,
    message: `Đã đặt lại mật khẩu cho tài khoản [${existing.fullName}] thành công.`,
  };
}
