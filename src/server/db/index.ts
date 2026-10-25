import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Cấu hình Singleton Pool để tránh tràn kết nối khi Next.js chạy dev hot-reload
const globalForDb = globalThis as unknown as {
  conn: Pool | undefined;
};

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://thilogi_admin:thilogi_secure_2026@localhost:5432/thilogi_db";

export const pool =
  globalForDb.conn ??
  new Pool({
    connectionString,
    max: 20, // Giới hạn tối đa 20 connections trên VPS
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = pool;
}

export const db = drizzle(pool, { schema });

/**
 * Hàm kiểm tra kết nối CSDL và xác thực trạng thái extension btree_gist
 */
export async function testDbConnection() {
  try {
    const res = await pool.query(`
      SELECT 
        current_database() as db_name,
        EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'btree_gist') as has_btree_gist,
        EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') as has_uuid_ossp;
    `);
    return {
      success: true,
      data: res.rows[0],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
