import { z } from "zod";

export type Field = { key: string; label: string; required?: boolean; max?: number; type?: "number" | "date" | "email"; options?: string[]; lookup?: string };
export const catalogs = {
  partners: { title: "Hồ sơ đối tác", table: "partners", id: "partner_id", name: "partner_name", fields: [
    { key: "partner_name", label: "Tên đối tác", required: true, max: 255 },
    { key: "short_name", label: "Tên viết tắt", max: 100 }, { key: "tax_code", label: "Mã số thuế", max: 50 },
    { key: "country", label: "Quốc gia", max: 100 }, { key: "address", label: "Địa chỉ" },
    { key: "phone", label: "Điện thoại", max: 50 }, { key: "email", label: "Email", type: "email", max: 255 },
    { key: "status", label: "Trạng thái", required: true, options: ["ACTIVE", "INACTIVE"] },
  ] },
  customers: { title: "Vai trò khách hàng", table: "customers", id: "customer_id", name: "customer_id", fields: [
    { key: "role_status", label: "Trạng thái vai trò", required: true, options: ["PENDING", "ACTIVE", "SUSPENDED"] },
    { key: "payment_terms_days", label: "Hạn thanh toán (ngày)", required: true, type: "number" },
    { key: "credit_limit_vnd", label: "Hạn mức tín dụng (VND)", type: "number" },
  ] },
  vendors: { title: "Vai trò nhà cung cấp", table: "vendors", id: "vendor_id", name: "vendor_id", fields: [
    { key: "vendor_type", label: "Loại nhà cung cấp", max: 50 },
    { key: "role_status", label: "Trạng thái vai trò", required: true, options: ["PENDING", "ACTIVE", "SUSPENDED"] },
  ] },
  locations: { title: "Địa điểm", table: "locations", id: "location_id", name: "name", fields: [
    { key: "code", label: "Mã địa điểm", required: true, max: 50 }, { key: "name", label: "Tên địa điểm", required: true, max: 255 },
    { key: "location_type", label: "Loại địa điểm", required: true, max: 50 },
    { key: "region_id", label: "Vùng", required: true, lookup: "regions" }, { key: "country_code", label: "Mã quốc gia", max: 10 },
    { key: "province", label: "Tỉnh / thành", max: 100 }, { key: "address", label: "Địa chỉ" },
    { key: "is_active", label: "Đang sử dụng", required: true, options: ["true", "false"] },
  ] },
  commodities: { title: "Hàng hóa", table: "commodities", id: "commodity_id", name: "name", fields: [
    { key: "name", label: "Tên hàng", required: true, max: 255 }, { key: "english_name", label: "Tên tiếng Anh", max: 255 },
    { key: "category", label: "Nhóm hàng", max: 100 }, { key: "specifications", label: "Quy cách", max: 255 },
    { key: "origin", label: "Xuất xứ", max: 100 }, { key: "purpose", label: "Mục đích sử dụng", max: 255 },
    { key: "status", label: "Trạng thái nguồn", max: 50 },
  ] },
  rates: { title: "Giá mua đường bộ", table: "road_rates", id: "rate_id", name: "equipment_type", fields: [
    { key: "vendor_id", label: "Nhà cung cấp", required: true, lookup: "vendors" },
    { key: "pickup_location_id", label: "Điểm đi", required: true, lookup: "locations" },
    { key: "delivery_location_id", label: "Điểm đến", required: true, lookup: "locations" },
    { key: "equipment_type", label: "Thiết bị", required: true, options: ["40HC", "40HR", "40RH", "20GP", "20HR", "20DC", "20RF", "TRUCK_15T", "TRUCK_FO", "RMS", "General"] },
    { key: "buy_rate", label: "Giá mua", required: true, type: "number" },
    { key: "currency", label: "Tiền tệ", required: true, options: ["VND", "USD", "LAK", "KHR"] },
    { key: "valid_from", label: "Hiệu lực từ (bao gồm)", required: true, type: "date" },
    { key: "valid_to", label: "Hiệu lực đến (không bao gồm)", required: true, type: "date" },
    { key: "remarks", label: "Ghi chú" },
  ] },
  equipment: { title: "Loại thiết bị & Container", table: "equipment_types", id: "equipment_type_id", name: "equipment_name", fields: [
    { key: "equipment_type_id", label: "Mã loại thiết bị", required: true, max: 30 },
    { key: "equipment_name", label: "Tên loại thiết bị", required: true, max: 255 },
    { key: "category", label: "Phân loại", required: true, options: ["REEFER_CONT", "DRY_CONT", "TRUCK", "TRAILER", "GENERAL"] },
    { key: "is_reefer", label: "Container Lạnh", required: true, options: ["true", "false"] },
    { key: "sort_order", label: "Thứ tự sắp xếp", type: "number" },
    { key: "is_active", label: "Đang sử dụng", required: true, options: ["true", "false"] },
  ] },
} satisfies Record<string, {title: string; table: string; id: string; name: string; fields: Field[]}>;
export type Catalog = keyof typeof catalogs;
export const catalogSchema = z.enum(["partners", "customers", "vendors", "locations", "commodities", "rates", "equipment"]);
export function validateFields(kind: Catalog, raw: unknown): Record<string, string | null> {
  const shape: Record<string, z.ZodType> = {};
  for (const f of catalogs[kind].fields as Field[]) {
    let rule = z.string().trim().max(f.max ?? 4000);
    if (f.required) rule = rule.min(1, `${f.label}: bắt buộc`);
    shape[f.key] = rule.refine(v => !v || !f.options || f.options.includes(v), `${f.label}: không hợp lệ`)
      .refine(v => !v || f.type !== "number" || /^\d+(\.\d{1,2})?$/.test(v), `${f.label}: số không âm, tối đa 2 số lẻ`)
      .refine(v => !v || f.type !== "email" || z.email().safeParse(v).success, "Email không hợp lệ")
      .refine(v => !v || f.type !== "date" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v), "Ngày không hợp lệ")
      .transform(v => v || null);
  }
  const data = z.object(shape).strict().parse(raw) as Record<string, string | null>;
  if (kind === "customers" && (!/^\d+$/.test(data.payment_terms_days!) || Number(data.payment_terms_days) > 3650)) throw new Error("Hạn thanh toán phải là số nguyên từ 0 đến 3650 ngày.");
  if (kind === "rates") {
    if (Number(data.buy_rate) <= 0 || Number(data.buy_rate) >= 1e13) throw new Error("Giá mua phải lớn hơn 0 và nhỏ hơn 10.000 tỷ.");
    if (data.pickup_location_id === data.delivery_location_id) throw new Error("Điểm đi và điểm đến phải khác nhau.");
    if (data.valid_to! <= data.valid_from!) throw new Error("Ngày kết thúc phải sau ngày bắt đầu.");
  }
  return data;
}
