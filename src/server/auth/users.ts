import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { CurrentActor, UserRole } from "./types";

/**
 * Tìm người dùng theo mã định danh (user_id) trực tiếp từ PostgreSQL qua Drizzle ORM
 */
export async function findUserById(userId: string): Promise<CurrentActor | null> {
  try {
    const rows = await db
      .select({
        userId: users.userId,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        regionScopes: users.regionScopes,
        email: users.email,
      })
      .from(users)
      .where(and(eq(users.userId, userId), eq(users.isActive, true)))
      .limit(1);

    if (rows.length > 0) {
      const r = rows[0];
      return {
        userId: r.userId,
        username: r.username,
        fullName: r.fullName,
        role: r.role as UserRole,
        regionScopes: Array.isArray(r.regionScopes) ? r.regionScopes : [r.regionScopes],
        email: r.email || undefined,
      };
    }
  } catch (err) {
    console.warn("Lỗi khi tìm user trong database:", err);
  }
  return null;
}

/**
 * Lấy danh sách toàn bộ tài khoản người dùng hoạt động từ PostgreSQL qua Drizzle ORM
 */
export async function getActiveUsersList(): Promise<CurrentActor[]> {
  try {
    const rows = await db
      .select({
        userId: users.userId,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        regionScopes: users.regionScopes,
        email: users.email,
      })
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(asc(users.role), asc(users.fullName));

    return rows.map((r) => ({
      userId: r.userId,
      username: r.username,
      fullName: r.fullName,
      role: r.role as UserRole,
      regionScopes: Array.isArray(r.regionScopes) ? r.regionScopes : [r.regionScopes],
      email: r.email || undefined,
    }));
  } catch (err) {
    console.warn("Lỗi khi lấy danh sách users từ database:", err);
  }
  return [];
}
