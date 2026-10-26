import { pool } from "@/server/db";
import { CurrentActor, UserRole } from "./types";

/**
 * Tìm người dùng theo mã định danh (user_id) trực tiếp từ PostgreSQL
 */
export async function findUserById(userId: string): Promise<CurrentActor | null> {
  try {
    const { rows } = await pool.query(
      `SELECT user_id, username, full_name, role, region_scopes, email 
       FROM users 
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    if (rows.length > 0) {
      const r = rows[0];
      return {
        userId: r.user_id,
        username: r.username,
        fullName: r.full_name,
        role: r.role as UserRole,
        regionScopes: Array.isArray(r.region_scopes) ? r.region_scopes : [r.region_scopes],
        email: r.email || undefined,
      };
    }
  } catch (err) {
    console.warn("Lỗi khi tìm user trong database:", err);
  }
  return null;
}

/**
 * Lấy danh sách toàn bộ tài khoản người dùng hoạt động từ PostgreSQL
 */
export async function getActiveUsersList(): Promise<CurrentActor[]> {
  try {
    const { rows } = await pool.query(
      `SELECT user_id, username, full_name, role, region_scopes, email 
       FROM users 
       WHERE is_active = true 
       ORDER BY role ASC, full_name ASC`
    );
    if (rows.length > 0) {
      return rows.map((r) => ({
        userId: r.user_id,
        username: r.username,
        fullName: r.full_name,
        role: r.role as UserRole,
        regionScopes: Array.isArray(r.region_scopes) ? r.region_scopes : [r.region_scopes],
        email: r.email || undefined,
      }));
    }
  } catch (err) {
    console.warn("Lỗi khi lấy danh sách users từ database:", err);
  }
  return [];
}
