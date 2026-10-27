import { z } from "zod";

const identifier = z.string().trim().min(1).max(50);
const amount = z.number().finite().min(0).max(9_999_999_999_999);

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
  originLocationId: identifier,
  destinationLocationId: identifier,
  equipmentType: z.string().trim().min(1).max(30),
  plannedQuantity: z.number().finite().min(1, "Số lượng kế hoạch tối thiểu là 1").max(99_999_999.99).multipleOf(0.01),
  unit: z.string().trim().min(1).max(20).default("TRIP"),

  // BUY Side (Snapshot từ Rate Lookup)
  selectedBuyRateId: z.string().uuid().optional(),
  selectedVendorId: z.string().optional(),
  selectedVendorName: z.string().optional(),
  unitBuyPrice: z.number().default(0),
  worstCaseBuyPrice: z.number().default(0),
  totalBuyAmount: z.number().default(0),

  // SELL Side (Nhân viên Pricing cấu thành)
  unitSellPrice: amount,
  totalSellPrice: amount,

  // P&L metrics
  itemGp: z.number().default(0),
  itemMarginPercent: z.number().default(0),
});

export const createQuotationSchema = z.object({
  quotationId: z.string().uuid().optional(),
  expectedUpdatedAt: z.string().min(1).max(100).optional(),
  customerId: identifier,
  regionId: identifier,
  commodityId: z.union([identifier, z.literal("")]).optional(),
  paymentTermsDays: z.number().int().min(0).max(3650).default(30),
  remarks: z.string().max(5000).optional(),
  items: z.array(quotationServiceItemSchema).min(1, "Báo giá cần ít nhất 1 dịch vụ").max(200),
}).refine((value) => !value.quotationId || !!value.expectedUpdatedAt, {
  message: "Vui lòng tải lại báo giá trước khi lưu.", path: ["expectedUpdatedAt"],
});

export const rateLookupSchema = z.object({
  pickupLocationId: identifier, deliveryLocationId: identifier,
  equipmentType: z.string().trim().min(1).max(30),
  pricingDate: z.iso.date(),
});

export const quotationListFilterSchema = z.object({
  status: z.enum(["ALL", "DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "SUPERSEDED"]).optional(),
  regionId: identifier.optional(), search: z.string().trim().max(200).optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export type QuotationServiceItemInput = z.infer<typeof quotationServiceItemSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
