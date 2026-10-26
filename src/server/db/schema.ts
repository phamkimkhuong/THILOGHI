import { pgTable, varchar, numeric, text, boolean, timestamp, integer, uuid, pgEnum, date, customType } from "drizzle-orm/pg-core";

export const daterange = customType<{ data: string; driverData: string }>({
  dataType() {
    return "daterange";
  },
});

// --------------------------------------------------------------------
// 1. PostgreSQL ENUMs
// --------------------------------------------------------------------
export const regionScopeEnum = pgEnum("RegionScope", [
  "QUANG_NAM_NEIGHBORS",
  "SOUTH_LAOS",
  "NORTH_CAMBODIA_CENTRAL_HIGHLANDS",
  "NORTHERN_REGION",
  "SOUTHERN_REGION_SNUOL",
]);

export const quotationStatusEnum = pgEnum("QuotationStatus", [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "SUPERSEDED",
]);

export const orderStatusEnum = pgEnum("OrderStatus", [
  "DRAFT",
  "CONFIRMED",
  "IN_PROGRESS",
  "OPERATIONALLY_CLOSED",
  "FINANCIALLY_CLOSED",
  "CANCELLED",
]);

export const shippingOrderStatusEnum = pgEnum("ShippingOrderStatus", [
  "DRAFT",
  "DISPATCHED",
  "AT_PICKUP",
  "IN_TRANSIT",
  "AT_DELIVERY",
  "DELIVERED",
  "DELIVERY_PROOF_COLLECTED", // Đã đổi từ POD_COLLECTED
  "CLOSED",
]);

export const pricingInclusionEnum = pgEnum("PricingInclusion", [
  "INCLUDED",
  "SEPARATELY_BILLED",
  "PASS_THROUGH_ACTUAL",
]);

export const recoveryStatusEnum = pgEnum("RecoveryStatus", [
  "NON_RECOVERABLE",
  "BILLABLE_TO_CUSTOMER",
  "CLAIM_TO_VENDOR",
]);

export const invoiceStatusEnum = pgEnum("InvoiceStatus", [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_SETTLED",
  "SETTLED",
  "CANCELLED",
]);

// --------------------------------------------------------------------
// 2. Master Data Tables
// --------------------------------------------------------------------
export const regions = pgTable("regions", {
  regionId: varchar("region_id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  scope: regionScopeEnum("scope").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const users = pgTable("users", {
  userId: varchar("user_id", { length: 50 }).primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  regionScopes: text("region_scopes").array().notNull(),
  email: varchar("email", { length: 255 }),
  company: varchar("company", { length: 100 }),
  department: varchar("department", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const locations = pgTable("locations", {
  locationId: varchar("location_id", { length: 50 }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  locationType: varchar("location_type", { length: 50 }).notNull(), // Stuffing Place, Port, Depot, Warehouse, Border
  regionId: varchar("region_id", { length: 50 }).references(() => regions.regionId),
  countryCode: varchar("country_code", { length: 10 }).default("VN"),
  province: varchar("province", { length: 100 }),
  address: text("address"),
  gpsCoordinates: varchar("gps_coordinates", { length: 100 }),
  company: varchar("company", { length: 100 }),
  status: varchar("status", { length: 50 }).default("Active"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const customers = pgTable("customers", {
  customerId: varchar("customer_id", { length: 50 }).primaryKey(),
  shortName: varchar("short_name", { length: 100 }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  partnerType: varchar("partner_type", { length: 50 }), // Clients, Consignee, Shipper, Suppliers, Vendors, Line, Port, Stuffing Place, Depot
  country: varchar("country", { length: 100 }),
  address: text("address"),
  gpsCoordinates: varchar("gps_coordinates", { length: 100 }),
  bankAccount: varchar("bank_account", { length: 100 }),
  bankName: varchar("bank_name", { length: 255 }),
  taxCode: varchar("tax_code", { length: 50 }),
  description: text("description"),
  signingDate: date("signing_date"),
  representedBy: varchar("represented_by", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  logoUrl: text("logo_url"),
  note: text("note"),
  regionId: varchar("region_id", { length: 50 }).references(() => regions.regionId),
  creditLimitVnd: numeric("credit_limit_vnd", { precision: 15, scale: 2 }).default("0"),
  paymentTermsDays: integer("payment_terms_days").default(30),
  status: varchar("status", { length: 50 }).default("Đã duyệt"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const vendors = pgTable("vendors", {
  vendorId: varchar("vendor_id", { length: 50 }).primaryKey(),
  shortName: varchar("short_name", { length: 100 }),
  vendorName: varchar("vendor_name", { length: 255 }).notNull(),
  vendorType: varchar("vendor_type", { length: 50 }).notNull(), // Vendors, Line, Suppliers, TRUCK_VENDOR, OCEAN_CARRIER
  taxCode: varchar("tax_code", { length: 50 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  regionId: varchar("region_id", { length: 50 }).references(() => regions.regionId),
  status: varchar("status", { length: 50 }).default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const commodities = pgTable("commodities", {
  commodityId: varchar("commodity_id", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  englishName: varchar("english_name", { length: 255 }),
  category: varchar("category", { length: 100 }),
  specifications: varchar("specifications", { length: 255 }),
  origin: varchar("origin", { length: 100 }),
  purpose: varchar("purpose", { length: 255 }),
  status: varchar("status", { length: 50 }).default("Đã duyệt"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --------------------------------------------------------------------
// 3. Rate Tables
// --------------------------------------------------------------------
export const roadRates = pgTable("road_rates", {
  rateId: uuid("rate_id").defaultRandom().primaryKey(),
  vendorId: varchar("vendor_id", { length: 50 }).notNull().references(() => vendors.vendorId),
  pickupLocationId: varchar("pickup_location_id", { length: 50 }).notNull().references(() => locations.locationId),
  deliveryLocationId: varchar("delivery_location_id", { length: 50 }).notNull().references(() => locations.locationId),
  equipmentType: varchar("equipment_type", { length: 30 }).notNull(), // 40HC, 40RH, 20DC...
  buyRate: numeric("buy_rate", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("VND"),
  validityRange: daterange("validity_range").notNull(),
  status: varchar("status", { length: 20 }).default("APPROVED"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --------------------------------------------------------------------
// 4. Quotation Tables
// --------------------------------------------------------------------
export const customerQuotations = pgTable("customer_quotations", {
  quotationId: uuid("quotation_id").defaultRandom().primaryKey(),
  quotationNo: varchar("quotation_no", { length: 50 }).notNull(),
  version: integer("version").default(1).notNull(),
  customerId: varchar("customer_id", { length: 50 }).notNull().references(() => customers.customerId),
  regionId: varchar("region_id", { length: 50 }).notNull().references(() => regions.regionId),
  commodityId: varchar("commodity_id", { length: 50 }).references(() => commodities.commodityId),
  status: quotationStatusEnum("status").default("DRAFT").notNull(),

  totalSellAmount: numeric("total_sell_amount", { precision: 15, scale: 2 }).default("0"),
  totalEstimatedBuy: numeric("total_estimated_buy", { precision: 15, scale: 2 }).default("0"),
  totalWorstCaseBuy: numeric("total_worst_case_buy", { precision: 15, scale: 2 }).default("0"),
  estimatedGp: numeric("estimated_gp", { precision: 15, scale: 2 }).default("0"),
  estimatedMarginPercent: numeric("estimated_margin_percent", { precision: 5, scale: 2 }).default("0"),

  currency: varchar("currency", { length: 3 }).default("VND"),
  paymentTermsDays: integer("payment_terms_days").default(30),
  validUntil: date("valid_until"),
  immutableLocked: boolean("immutable_locked").default(false),
  createdBy: varchar("created_by", { length: 100 }),
  approvedBy: varchar("approved_by", { length: 100 }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// P0.2: Ancillary services chỉ tạo qua các dòng dịch vụ tường minh này
export const quotationServiceItems = pgTable("quotation_service_items", {
  itemId: uuid("item_id").defaultRandom().primaryKey(),
  quotationId: uuid("quotation_id").notNull().references(() => customerQuotations.quotationId, { onDelete: "cascade" }),
  servicePackage: varchar("service_package", { length: 50 }).notNull(), // TRUCKING, OCEAN, PORT, CUSTOMS, BORDER_GATE, WAREHOUSING, INSURANCE, OTHER
  pricingInclusion: pricingInclusionEnum("pricing_inclusion").default("INCLUDED"),
  originLocationId: varchar("origin_location_id", { length: 50 }).references(() => locations.locationId),
  destinationLocationId: varchar("destination_location_id", { length: 50 }).references(() => locations.locationId),
  equipmentType: varchar("equipment_type", { length: 30 }),
  plannedQuantity: numeric("planned_quantity", { precision: 10, scale: 2 }).default("1"),
  unit: varchar("unit", { length: 20 }).default("TRIP"),

  unitSellPrice: numeric("unit_sell_price", { precision: 15, scale: 2 }).default("0"),
  totalSellPrice: numeric("total_sell_price", { precision: 15, scale: 2 }).default("0"),

  selectedBuyRateId: uuid("selected_buy_rate_id"),
  estimatedBuyAmount: numeric("estimated_buy_amount", { precision: 15, scale: 2 }).default("0"),
  worstCaseBuyAmount: numeric("worst_case_buy_amount", { precision: 15, scale: 2 }).default("0"),

  itemGp: numeric("item_gp", { precision: 15, scale: 2 }).default("0"),
  itemMarginPercent: numeric("item_margin_percent", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const quotationBuySnapshots = pgTable("quotation_buy_snapshots", {
  snapshotId: uuid("snapshot_id").defaultRandom().primaryKey(),
  quotationId: uuid("quotation_id").notNull().references(() => customerQuotations.quotationId, { onDelete: "cascade" }),
  itemId: uuid("item_id").notNull().references(() => quotationServiceItems.itemId, { onDelete: "cascade" }),
  sourceRateId: uuid("source_rate_id").notNull(),
  vendorId: varchar("vendor_id", { length: 50 }).notNull().references(() => vendors.vendorId),
  vendorName: varchar("vendor_name", { length: 255 }).notNull(),
  rateAmount: numeric("rate_amount", { precision: 15, scale: 2 }).notNull(),
  originalCurrency: varchar("original_currency", { length: 3 }).notNull(),
  fxRateToVnd: numeric("fx_rate_to_vnd", { precision: 12, scale: 4 }).default("1.0000"),
  rateAmountVnd: numeric("rate_amount_vnd", { precision: 15, scale: 2 }).notNull(),
  validityStart: date("validity_start").notNull(),
  validityEnd: date("validity_end").notNull(),
  snapshotAt: timestamp("snapshot_at", { withTimezone: true }).defaultNow(),
});

export const quotationApprovalLog = pgTable("quotation_approval_log", {
  logId: uuid("log_id").defaultRandom().primaryKey(),
  quotationId: uuid("quotation_id").notNull().references(() => customerQuotations.quotationId, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  actorId: varchar("actor_id", { length: 100 }).notNull(),
  actorName: varchar("actor_name", { length: 255 }),
  comment: text("comment"),
  snapshotMarginPercent: numeric("snapshot_margin_percent", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --------------------------------------------------------------------
// 5. Orders & Fulfillment Tables (P1.6 & P1.7)
// --------------------------------------------------------------------
export const orders = pgTable("orders", {
  orderId: uuid("order_id").defaultRandom().primaryKey(),
  orderNo: varchar("order_no", { length: 50 }).notNull().unique(),
  quotationId: uuid("quotation_id").notNull().references(() => customerQuotations.quotationId),
  quotationVersion: integer("quotation_version").notNull(),
  customerId: varchar("customer_id", { length: 50 }).notNull().references(() => customers.customerId),
  regionId: varchar("region_id", { length: 50 }).notNull().references(() => regions.regionId),
  status: orderStatusEnum("status").default("CONFIRMED").notNull(),

  revenueVnd: numeric("revenue_vnd", { precision: 15, scale: 2 }).default("0"),
  costVnd: numeric("cost_vnd", { precision: 15, scale: 2 }).default("0"),
  gpVnd: numeric("gp_vnd", { precision: 15, scale: 2 }).default("0"),
  marginPercent: numeric("margin_percent", { precision: 5, scale: 2 }).default("0"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const orderServiceItems = pgTable("order_service_items", {
  orderItemId: uuid("order_item_id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.orderId),
  servicePackage: varchar("service_package", { length: 50 }).notNull(),
  originLocationId: varchar("origin_location_id", { length: 50 }).references(() => locations.locationId),
  destinationLocationId: varchar("destination_location_id", { length: 50 }).references(() => locations.locationId),
  equipmentType: varchar("equipment_type", { length: 30 }),

  // P1.7: Hỗ trợ Partial Release (Bàn giao vận hành theo từng đợt)
  plannedTripQty: integer("planned_trip_qty").default(1).notNull(),
  releasedTripQty: integer("released_trip_qty").default(0).notNull(),

  sellAmountVnd: numeric("sell_amount_vnd", { precision: 15, scale: 2 }).default("0"),
  estimatedBuyVnd: numeric("estimated_buy_vnd", { precision: 15, scale: 2 }).default("0"),
  actualBuyVnd: numeric("actual_buy_vnd", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// P1.6: Ocean Order chỉ tạo Work Request; Sea Shipment hình thành khi có dữ liệu tàu thực tế
export const oceanWorkRequests = pgTable("ocean_work_requests", {
  requestId: uuid("request_id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.orderId),
  orderItemId: uuid("order_item_id").notNull().references(() => orderServiceItems.orderItemId),
  polLocationId: varchar("pol_location_id", { length: 50 }).notNull().references(() => locations.locationId), // Port of Loading
  podLocationId: varchar("pod_location_id", { length: 50 }).notNull().references(() => locations.locationId), // P0.4: Port of Discharge (POD)
  equipmentType: varchar("equipment_type", { length: 30 }).notNull(),
  containerQty: integer("container_qty").default(1).notNull(),
  status: varchar("status", { length: 30 }).default("PENDING_BOOKING"), // PENDING_BOOKING, BOOKED, CANCELLED
  bookingNo: varchar("booking_no", { length: 100 }),
  seaShipmentId: uuid("sea_shipment_id"), // Liên kết khi tàu thực tế được xác nhận
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// P1.7: Shipping Orders sinh khi bấm "Release to Operations"
export const shippingOrders = pgTable("shipping_orders", {
  shippingOrderId: uuid("shipping_order_id").defaultRandom().primaryKey(),
  shippingOrderNo: varchar("shipping_order_no", { length: 50 }).notNull().unique(),
  orderId: uuid("order_id").notNull().references(() => orders.orderId),
  orderItemId: uuid("order_item_id").notNull().references(() => orderServiceItems.orderItemId),
  vendorId: varchar("vendor_id", { length: 50 }).references(() => vendors.vendorId),
  pickupLocationId: varchar("pickup_location_id", { length: 50 }).notNull().references(() => locations.locationId),
  deliveryLocationId: varchar("delivery_location_id", { length: 50 }).notNull().references(() => locations.locationId),
  equipmentType: varchar("equipment_type", { length: 30 }),
  containerNo: varchar("container_no", { length: 50 }),
  sealNo: varchar("seal_no", { length: 50 }),
  seaRefId: varchar("sea_ref_id", { length: 100 }), // Tham chiếu Booking / DO nếu liên quan cảng
  status: shippingOrderStatusEnum("status").default("DRAFT").notNull(),

  // P0.4: Proof of Delivery đổi thành Delivery Proof
  deliveryProofFile: text("delivery_proof_file"),
  deliveryProofVerified: boolean("delivery_proof_verified").default(false),
  deliveryProofAt: timestamp("delivery_proof_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --------------------------------------------------------------------
// 6. AR & AP Invoice Level Management (P0.5)
// Số dư công nợ quản ở Invoice level, sau đó phân bổ (Allocation) về Order / Actual Cost
// --------------------------------------------------------------------
export const customerInvoices = pgTable("customer_invoices", {
  invoiceId: uuid("invoice_id").defaultRandom().primaryKey(),
  invoiceNo: varchar("invoice_no", { length: 50 }).notNull().unique(), // Hóa đơn tài chính GTGT
  customerId: varchar("customer_id", { length: 50 }).notNull().references(() => customers.customerId),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),

  totalAmountVnd: numeric("total_amount_vnd", { precision: 15, scale: 2 }).notNull(),
  settledAmountVnd: numeric("settled_amount_vnd", { precision: 15, scale: 2 }).default("0"),
  openBalanceVnd: numeric("open_balance_vnd", { precision: 15, scale: 2 }).notNull(), // Số dư công nợ còn lại
  status: invoiceStatusEnum("status").default("ISSUED").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const customerInvoiceAllocations = pgTable("customer_invoice_allocations", {
  allocationId: uuid("allocation_id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").notNull().references(() => customerInvoices.invoiceId),
  orderId: uuid("order_id").notNull().references(() => orders.orderId),
  orderItemId: uuid("order_item_id").references(() => orderServiceItems.orderItemId),
  allocatedAmountVnd: numeric("allocated_amount_vnd", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const vendorInvoices = pgTable("vendor_invoices", {
  invoiceId: uuid("invoice_id").defaultRandom().primaryKey(),
  invoiceNo: varchar("invoice_no", { length: 50 }).notNull(), // Số hóa đơn của NCC
  vendorId: varchar("vendor_id", { length: 50 }).notNull().references(() => vendors.vendorId),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),

  totalAmountVnd: numeric("total_amount_vnd", { precision: 15, scale: 2 }).notNull(),
  paidAmountVnd: numeric("paid_amount_vnd", { precision: 15, scale: 2 }).default("0"),
  openBalanceVnd: numeric("open_balance_vnd", { precision: 15, scale: 2 }).notNull(), // Nợ phải trả NCC còn lại
  status: invoiceStatusEnum("status").default("ISSUED").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const vendorInvoiceAllocations = pgTable("vendor_invoice_allocations", {
  allocationId: uuid("allocation_id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").notNull().references(() => vendorInvoices.invoiceId),
  orderId: uuid("order_id").notNull().references(() => orders.orderId),
  shippingOrderId: uuid("shipping_order_id").references(() => shippingOrders.shippingOrderId),
  allocatedAmountVnd: numeric("allocated_amount_vnd", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
