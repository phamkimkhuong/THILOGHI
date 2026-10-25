import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./database/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://thilogi_admin:thilogi_secure_2026@localhost:5432/thilogi_db",
  },
});
