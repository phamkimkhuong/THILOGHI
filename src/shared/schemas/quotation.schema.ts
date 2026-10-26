import { z } from "zod";

export const servicePackageEnum = z.enum([
  "TRUCKING",
  "OCEAN",
  "PORT",
  "CUSTOMS",
  "BORDER_GATE",
  "WAREHOUSING",
  "INSURANCE",
  "OTHER",
]);

export type ServicePackage = z.infer<typeof servicePackageEnum>;

export const pricingInclusionEnum = z.enum([
  "INCLUDED",
  "SEPARATELY_BILLED",
  "PASS_THROUGH_ACTUAL",
]);

export const quotationServiceItemSchema = z.object({
  id: z.string().optional(),
  servicePackage: servicePackageEnum,
  pricingInclusion: pricingInclusionEnum.default("INCLUDED"),
  originLocationId: z.string().min(1, "Vui lòng chọn điểm nhận/xếp hàng"),
  destinationLocationId: z.string().min(1, "Vui lòng chọn điểm giao/dỡ hàng"),
  equipmentType: z.string().min(1, "Vui lòng chọn loại container/thiết bị"),
  plannedQuantity: z.number().min(1, "Số lượng kế hoạch tối thiểu là 1"),
  unit: z.string().default("TRIP"),

  // BUY Side (Snapshot từ Rate Lookup)
  selectedBuyRateId: z.string().optional(),
  selectedVendorId: z.string().optional(),
  selectedVendorName: z.string().optional(),
  unitBuyPrice: z.number().default(0),
  worstCaseBuyPrice: z.number().default(0),
  totalBuyAmount: z.number().default(0),

  // SELL Side (Nhân viên Pricing cấu thành)
  unitSellPrice: z.number().min(0, "Giá bán không được âm"),
  totalSellPrice: z.number().min(0, "Tổng giá bán không được âm"),

  // P&L metrics
  itemGp: z.number().default(0),
  itemMarginPercent: z.number().default(0),
});

export const createQuotationSchema = z.object({
  quotationId: z.string().optional(),
  customerId: z.string().min(1, "Vui lòng chọn Khách hàng"),
  regionId: z.string().min(1, "Vui lòng chọn Phân vùng áp dụng"),
  commodityId: z.string().optional(),
  paymentTermsDays: z.number().min(0).default(30),
  remarks: z.string().optional(),
  items: z.array(quotationServiceItemSchema).min(1, "Báo giá cần ít nhất 1 dịch vụ"),
});

export type QuotationServiceItemInput = z.infer<typeof quotationServiceItemSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
