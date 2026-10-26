import { NextResponse } from "next/server";
import { testDbConnection } from "@/server/db";

export async function GET() {
  const result = await testDbConnection();
  const isProd = process.env.NODE_ENV === "production";

  return NextResponse.json({
    status: result.success ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    database: result.success ? "connected" : "disconnected",
    // Chỉ hiển thị chi tiết trong môi trường development, tuyệt đối không leak trên production
    ...(isProd ? {} : { details: result }),
  });
}
