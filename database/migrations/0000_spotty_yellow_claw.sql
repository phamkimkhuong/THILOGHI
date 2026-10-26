CREATE TYPE "public"."InvoiceStatus" AS ENUM('DRAFT', 'ISSUED', 'PARTIALLY_SETTLED', 'SETTLED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."OrderStatus" AS ENUM('DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'OPERATIONALLY_CLOSED', 'FINANCIALLY_CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."PricingInclusion" AS ENUM('INCLUDED', 'SEPARATELY_BILLED', 'PASS_THROUGH_ACTUAL');--> statement-breakpoint
CREATE TYPE "public"."QuotationStatus" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUPERSEDED');--> statement-breakpoint
CREATE TYPE "public"."RecoveryStatus" AS ENUM('NON_RECOVERABLE', 'BILLABLE_TO_CUSTOMER', 'CLAIM_TO_VENDOR');--> statement-breakpoint
CREATE TYPE "public"."RegionScope" AS ENUM('QUANG_NAM_NEIGHBORS', 'SOUTH_LAOS', 'NORTH_CAMBODIA_CENTRAL_HIGHLANDS', 'NORTHERN_REGION', 'SOUTHERN_REGION_SNUOL');--> statement-breakpoint
CREATE TYPE "public"."ShippingOrderStatus" AS ENUM('DRAFT', 'DISPATCHED', 'AT_PICKUP', 'IN_TRANSIT', 'AT_DELIVERY', 'DELIVERED', 'DELIVERY_PROOF_COLLECTED', 'CLOSED');--> statement-breakpoint
CREATE TABLE "commodities" (
	"commodity_id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"is_dangerous_goods" boolean DEFAULT false,
	"temperature_required" varchar(50),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_invoice_allocations" (
	"allocation_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid,
	"allocated_amount_vnd" numeric(15, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_invoices" (
	"invoice_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_no" varchar(50) NOT NULL,
	"customer_id" varchar(50) NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date NOT NULL,
	"total_amount_vnd" numeric(15, 2) NOT NULL,
	"settled_amount_vnd" numeric(15, 2) DEFAULT '0',
	"open_balance_vnd" numeric(15, 2) NOT NULL,
	"status" "InvoiceStatus" DEFAULT 'ISSUED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "customer_invoices_invoice_no_unique" UNIQUE("invoice_no")
);
--> statement-breakpoint
CREATE TABLE "customer_quotations" (
	"quotation_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_no" varchar(50) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"customer_id" varchar(50) NOT NULL,
	"region_id" varchar(50) NOT NULL,
	"commodity_id" varchar(50),
	"status" "QuotationStatus" DEFAULT 'DRAFT' NOT NULL,
	"total_sell_amount" numeric(15, 2) DEFAULT '0',
	"total_estimated_buy" numeric(15, 2) DEFAULT '0',
	"total_worst_case_buy" numeric(15, 2) DEFAULT '0',
	"estimated_gp" numeric(15, 2) DEFAULT '0',
	"estimated_margin_percent" numeric(5, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'VND',
	"payment_terms_days" integer DEFAULT 30,
	"valid_until" date,
	"immutable_locked" boolean DEFAULT false,
	"created_by" varchar(100),
	"approved_by" varchar(100),
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"customer_id" varchar(50) PRIMARY KEY NOT NULL,
	"tax_code" varchar(50),
	"customer_name" varchar(255) NOT NULL,
	"short_name" varchar(100),
	"region_id" varchar(50),
	"credit_limit_vnd" numeric(15, 2) DEFAULT '0',
	"payment_terms_days" integer DEFAULT 30,
	"status" varchar(20) DEFAULT 'ACTIVE',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"location_id" varchar(50) PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"location_type" varchar(50) NOT NULL,
	"region_id" varchar(50),
	"country_code" varchar(2) DEFAULT 'VN',
	"address" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "locations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ocean_work_requests" (
	"request_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"pol_location_id" varchar(50) NOT NULL,
	"pod_location_id" varchar(50) NOT NULL,
	"equipment_type" varchar(30) NOT NULL,
	"container_qty" integer DEFAULT 1 NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING_BOOKING',
	"booking_no" varchar(100),
	"sea_shipment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_service_items" (
	"order_item_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"service_package" varchar(50) NOT NULL,
	"origin_location_id" varchar(50),
	"destination_location_id" varchar(50),
	"equipment_type" varchar(30),
	"planned_trip_qty" integer DEFAULT 1 NOT NULL,
	"released_trip_qty" integer DEFAULT 0 NOT NULL,
	"sell_amount_vnd" numeric(15, 2) DEFAULT '0',
	"estimated_buy_vnd" numeric(15, 2) DEFAULT '0',
	"actual_buy_vnd" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"order_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_no" varchar(50) NOT NULL,
	"quotation_id" uuid NOT NULL,
	"quotation_version" integer NOT NULL,
	"customer_id" varchar(50) NOT NULL,
	"region_id" varchar(50) NOT NULL,
	"status" "OrderStatus" DEFAULT 'CONFIRMED' NOT NULL,
	"revenue_vnd" numeric(15, 2) DEFAULT '0',
	"cost_vnd" numeric(15, 2) DEFAULT '0',
	"gp_vnd" numeric(15, 2) DEFAULT '0',
	"margin_percent" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "orders_order_no_unique" UNIQUE("order_no")
);
--> statement-breakpoint
CREATE TABLE "quotation_approval_log" (
	"log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"action" varchar(50) NOT NULL,
	"actor_id" varchar(100) NOT NULL,
	"actor_name" varchar(255),
	"comment" text,
	"snapshot_margin_percent" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotation_buy_snapshots" (
	"snapshot_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"source_rate_id" uuid NOT NULL,
	"vendor_id" varchar(50) NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"rate_amount" numeric(15, 2) NOT NULL,
	"original_currency" varchar(3) NOT NULL,
	"fx_rate_to_vnd" numeric(12, 4) DEFAULT '1.0000',
	"rate_amount_vnd" numeric(15, 2) NOT NULL,
	"validity_start" date NOT NULL,
	"validity_end" date NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotation_service_items" (
	"item_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"service_package" varchar(50) NOT NULL,
	"pricing_inclusion" "PricingInclusion" DEFAULT 'INCLUDED',
	"origin_location_id" varchar(50),
	"destination_location_id" varchar(50),
	"equipment_type" varchar(30),
	"planned_quantity" numeric(10, 2) DEFAULT '1',
	"unit" varchar(20) DEFAULT 'TRIP',
	"unit_sell_price" numeric(15, 2) DEFAULT '0',
	"total_sell_price" numeric(15, 2) DEFAULT '0',
	"selected_buy_rate_id" uuid,
	"estimated_buy_amount" numeric(15, 2) DEFAULT '0',
	"worst_case_buy_amount" numeric(15, 2) DEFAULT '0',
	"item_gp" numeric(15, 2) DEFAULT '0',
	"item_margin_percent" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"region_id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"scope" "RegionScope" NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "road_rates" (
	"rate_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" varchar(50) NOT NULL,
	"pickup_location_id" varchar(50) NOT NULL,
	"delivery_location_id" varchar(50) NOT NULL,
	"equipment_type" varchar(30) NOT NULL,
	"buy_rate" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'VND',
	"validity_range" daterange NOT NULL,
	"status" varchar(20) DEFAULT 'APPROVED',
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shipping_orders" (
	"shipping_order_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipping_order_no" varchar(50) NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"vendor_id" varchar(50),
	"pickup_location_id" varchar(50) NOT NULL,
	"delivery_location_id" varchar(50) NOT NULL,
	"equipment_type" varchar(30),
	"container_no" varchar(50),
	"seal_no" varchar(50),
	"sea_ref_id" varchar(100),
	"status" "ShippingOrderStatus" DEFAULT 'DRAFT' NOT NULL,
	"delivery_proof_file" text,
	"delivery_proof_verified" boolean DEFAULT false,
	"delivery_proof_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "shipping_orders_shipping_order_no_unique" UNIQUE("shipping_order_no")
);
--> statement-breakpoint
CREATE TABLE "vendor_invoice_allocations" (
	"allocation_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"shipping_order_id" uuid,
	"allocated_amount_vnd" numeric(15, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_invoices" (
	"invoice_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_no" varchar(50) NOT NULL,
	"vendor_id" varchar(50) NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date NOT NULL,
	"total_amount_vnd" numeric(15, 2) NOT NULL,
	"paid_amount_vnd" numeric(15, 2) DEFAULT '0',
	"open_balance_vnd" numeric(15, 2) NOT NULL,
	"status" "InvoiceStatus" DEFAULT 'ISSUED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"vendor_id" varchar(50) PRIMARY KEY NOT NULL,
	"tax_code" varchar(50),
	"vendor_name" varchar(255) NOT NULL,
	"vendor_type" varchar(50) NOT NULL,
	"region_id" varchar(50),
	"contact_phone" varchar(50),
	"status" varchar(20) DEFAULT 'ACTIVE',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "customer_invoice_allocations" ADD CONSTRAINT "customer_invoice_allocations_invoice_id_customer_invoices_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."customer_invoices"("invoice_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoice_allocations" ADD CONSTRAINT "customer_invoice_allocations_order_id_orders_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoice_allocations" ADD CONSTRAINT "customer_invoice_allocations_order_item_id_order_service_items_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_service_items"("order_item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_quotations" ADD CONSTRAINT "customer_quotations_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_quotations" ADD CONSTRAINT "customer_quotations_region_id_regions_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("region_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_quotations" ADD CONSTRAINT "customer_quotations_commodity_id_commodities_commodity_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("commodity_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_region_id_regions_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("region_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_region_id_regions_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("region_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocean_work_requests" ADD CONSTRAINT "ocean_work_requests_order_id_orders_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocean_work_requests" ADD CONSTRAINT "ocean_work_requests_order_item_id_order_service_items_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_service_items"("order_item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocean_work_requests" ADD CONSTRAINT "ocean_work_requests_pol_location_id_locations_location_id_fk" FOREIGN KEY ("pol_location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocean_work_requests" ADD CONSTRAINT "ocean_work_requests_pod_location_id_locations_location_id_fk" FOREIGN KEY ("pod_location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_service_items" ADD CONSTRAINT "order_service_items_order_id_orders_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_service_items" ADD CONSTRAINT "order_service_items_origin_location_id_locations_location_id_fk" FOREIGN KEY ("origin_location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_service_items" ADD CONSTRAINT "order_service_items_destination_location_id_locations_location_id_fk" FOREIGN KEY ("destination_location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_quotation_id_customer_quotations_quotation_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."customer_quotations"("quotation_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_region_id_regions_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("region_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_approval_log" ADD CONSTRAINT "quotation_approval_log_quotation_id_customer_quotations_quotation_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."customer_quotations"("quotation_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_buy_snapshots" ADD CONSTRAINT "quotation_buy_snapshots_quotation_id_customer_quotations_quotation_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."customer_quotations"("quotation_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_buy_snapshots" ADD CONSTRAINT "quotation_buy_snapshots_item_id_quotation_service_items_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."quotation_service_items"("item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_buy_snapshots" ADD CONSTRAINT "quotation_buy_snapshots_vendor_id_vendors_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("vendor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_service_items" ADD CONSTRAINT "quotation_service_items_quotation_id_customer_quotations_quotation_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."customer_quotations"("quotation_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_service_items" ADD CONSTRAINT "quotation_service_items_origin_location_id_locations_location_id_fk" FOREIGN KEY ("origin_location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_service_items" ADD CONSTRAINT "quotation_service_items_destination_location_id_locations_location_id_fk" FOREIGN KEY ("destination_location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "road_rates" ADD CONSTRAINT "road_rates_vendor_id_vendors_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("vendor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "road_rates" ADD CONSTRAINT "road_rates_pickup_location_id_locations_location_id_fk" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "road_rates" ADD CONSTRAINT "road_rates_delivery_location_id_locations_location_id_fk" FOREIGN KEY ("delivery_location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_orders" ADD CONSTRAINT "shipping_orders_order_id_orders_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_orders" ADD CONSTRAINT "shipping_orders_order_item_id_order_service_items_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_service_items"("order_item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_orders" ADD CONSTRAINT "shipping_orders_vendor_id_vendors_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("vendor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_orders" ADD CONSTRAINT "shipping_orders_pickup_location_id_locations_location_id_fk" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_orders" ADD CONSTRAINT "shipping_orders_delivery_location_id_locations_location_id_fk" FOREIGN KEY ("delivery_location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoice_allocations" ADD CONSTRAINT "vendor_invoice_allocations_invoice_id_vendor_invoices_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."vendor_invoices"("invoice_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoice_allocations" ADD CONSTRAINT "vendor_invoice_allocations_order_id_orders_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoice_allocations" ADD CONSTRAINT "vendor_invoice_allocations_shipping_order_id_shipping_orders_shipping_order_id_fk" FOREIGN KEY ("shipping_order_id") REFERENCES "public"."shipping_orders"("shipping_order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_vendor_id_vendors_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("vendor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_region_id_regions_region_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("region_id") ON DELETE no action ON UPDATE no action;