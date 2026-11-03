"use server";
import { requireAuth } from "@/server/auth/authorize";
import { listMaintenance, maintenanceHistory, maintenanceOptions, mutateMaintenance } from "@/server/modules/master-data/maintenance.service";
import type { Catalog } from "./maintenance-config";
function message(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  if (code === "42P01") return "Cơ sở dữ liệu chưa có cấu trúc đợt 3. Quản trị viên cần chạy migration phase3-maintenance.sql.";
  if (code) return "Không thể thực hiện thao tác với cơ sở dữ liệu. Vui lòng tải lại hoặc liên hệ quản trị viên.";
  return error instanceof Error ? error.message : "Không thể thực hiện thao tác.";
}
export async function listMaintenanceAction(kind: Catalog, search: string, page: number) {
  try { const actor = await requireAuth(); return { success: true as const, ...await listMaintenance(kind, search, page), role: actor.role }; }
  catch (error) { return { success: false as const, error: message(error) }; }
}
export async function saveMaintenanceAction(input: unknown) {
  try { const actor = await requireAuth(); return { success: true as const, id: await mutateMaintenance(input, actor) }; }
  catch (error) { return { success: false as const, error: message(error) }; }
}
export async function historyMaintenanceAction(kind: Catalog, id: string) {
  try { await requireAuth(); return { success: true as const, rows: await maintenanceHistory(kind, id) }; }
  catch (error) { return { success: false as const, error: message(error) }; }
}
export async function optionsMaintenanceAction(kind: string, search: string) {
  try { await requireAuth(); return { success: true as const, rows: await maintenanceOptions(kind, search) }; }
  catch (error) { return { success: false as const, error: message(error) }; }
}
