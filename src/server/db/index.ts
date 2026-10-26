import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Cấu hình Singleton Pool lazy để tránh lỗi trong quá trình Docker build và tránh tràn kết nối khi Next.js chạy dev hot-reload
const globalForDb = globalThis as unknown as {
  conn: Pool | undefined;
  drizzleDb: ReturnType<typeof drizzle> | undefined;
};

export function getDbPool(): Pool {
  if (!globalForDb.conn) {
    const connectionString =
      process.env.DATABASE_URL ||
      (process.env.NODE_ENV === "production"
        ? undefined
        : "postgres://thilogi_admin:thilogi_secure_2026@localhost:5432/thilogi_db");

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not configured. Please set DATABASE_URL in your environment variables at runtime."
      );
    }

    globalForDb.conn = new Pool({
      connectionString,
      max: 20, // Giới hạn tối đa 20 connections trên VPS
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return globalForDb.conn;
}

// Transparent Proxy để giữ nguyên cú pháp gọi pool.query(...), pool.connect(...)
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const p = getDbPool();
    const val = (p as unknown as Record<string, unknown>)[prop as string];
    if (typeof val === "function") {
      return (val as (...args: unknown[]) => unknown).bind(p);
    }
    return val;
  },
});

export function getDrizzleDb() {
  if (!globalForDb.drizzleDb) {
    globalForDb.drizzleDb = drizzle(pool, { schema });
  }
  return globalForDb.drizzleDb;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const d = getDrizzleDb();
    const val = (d as unknown as Record<string, unknown>)[prop as string];
    if (typeof val === "function") {
      return (val as (...args: unknown[]) => unknown).bind(d);
    }
    return val;
  },
});

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
