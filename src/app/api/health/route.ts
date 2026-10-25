import { NextResponse } from "next/server";
import { testDbConnection } from "@/server/db";

export async function GET() {
  const result = await testDbConnection();
  return NextResponse.json({
    status: result.success ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    details: result,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      databaseConfigured: !!process.env.DATABASE_URL,
    },
  });
}
