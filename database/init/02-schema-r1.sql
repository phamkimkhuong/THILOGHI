-- ====================================================================
-- THILOGI Web Logistics Operating Platform - Release 1 Schema
-- File: 02-schema-r1.sql
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU ENUM CHUẨN
-- --------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RegionScope') THEN
        CREATE TYPE "RegionScope" AS ENUM (
            'QUANG_NAM_NEIGHBORS',
            'SOUTH_LAOS',
            'NORTH_CAMBODIA_CENTRAL_HIGHLANDS',
            'NORTHERN_REGION',
            'SOUTHERN_REGION_SNUOL'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuotationStatus') THEN
        CREATE TYPE "QuotationStatus" AS ENUM (
            'DRAFT',
            'PENDING_APPROVAL',
            'APPROVED',
            'REJECTED',
            'SUPERSEDED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
        CREATE TYPE "OrderStatus" AS ENUM (
            'DRAFT',
            'CONFIRMED',
            'IN_PROGRESS',
            'OPERATIONALLY_CLOSED',
            'FINANCIALLY_CLOSED',
            'CANCELLED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShippingOrderStatus') THEN
        CREATE TYPE "ShippingOrderStatus" AS ENUM (
            'DRAFT',
            'DISPATCHED',
            'AT_PICKUP',
            'IN_TRANSIT',
            'AT_DELIVERY',
            'DELIVERED',
            'DELIVERY_PROOF_COLLECTED',
            'CLOSED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PricingInclusion') THEN
        CREATE TYPE "PricingInclusion" AS ENUM (
            'INCLUDED',
            'SEPARATELY_BILLED',
            'PASS_THROUGH_ACTUAL'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RecoveryStatus') THEN
        CREATE TYPE "RecoveryStatus" AS ENUM (
            'NON_RECOVERABLE',
            'BILLABLE_TO_CUSTOMER',
            'CLAIM_TO_VENDOR'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvoiceStatus') THEN
        CREATE TYPE "InvoiceStatus" AS ENUM (
            'DRAFT',
            'ISSUED',
            'PARTIALLY_SETTLED',
            'SETTLED',
            'CANCELLED'
        );
    END IF;
END $$;

-- --------------------------------------------------------------------
-- 2. MASTER DATA TABLES
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS regions (
    region_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scope "RegionScope" NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.1. Quản lý Người dùng & Phân quyền Vùng (Users & Roles)
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- PRICING_MANAGER, SALES, OPERATIONS, DIRECTOR, ADMIN
    region_scopes TEXT[] NOT NULL DEFAULT '{}',
    email VARCHAR(255),
    company VARCHAR(100),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
    location_id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location_type VARCHAR(50) NOT NULL,
    region_id VARCHAR(50) REFERENCES regions(region_id),
    country_code VARCHAR(10) DEFAULT 'VN',
    province VARCHAR(100),
    address TEXT,
    gps_coordinates VARCHAR(100),
    company VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.3. Khách hàng (Customers & Đối tác hợp nhất)
CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    short_name VARCHAR(100),
    customer_name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(50),
    country VARCHAR(100),
    address TEXT,
    gps_coordinates VARCHAR(100),
    bank_account VARCHAR(100),
    bank_name VARCHAR(255),
    tax_code VARCHAR(50),
    description TEXT,
    signing_date DATE,
    represented_by VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    note TEXT,
    region_id VARCHAR(50) REFERENCES regions(region_id),
    credit_limit_vnd NUMERIC(15, 2) DEFAULT 0,
    payment_terms_days INT DEFAULT 30,
    status VARCHAR(50) DEFAULT 'Đã duyệt',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.4. Nhà cung cấp, Nhà xe, Hãng tàu (Vendors)
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id VARCHAR(50) PRIMARY KEY,
    short_name VARCHAR(100),
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(50) NOT NULL,
    tax_code VARCHAR(50),
    contact_phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    region_id VARCHAR(50) REFERENCES regions(region_id),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2.5. Danh mục Mặt hàng (Commodities)
CREATE TABLE IF NOT EXISTS commodities (
    commodity_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    english_name VARCHAR(255),
    category VARCHAR(100),
    specifications VARCHAR(255),
    origin VARCHAR(100),
    purpose VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Đã duyệt',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 3. SUPPLIER RATE LIBRARY (THƯ VIỆN BẢNG GIÁ MUA ĐẦU VÀO)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS road_rates (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id VARCHAR(50) NOT NULL REFERENCES vendors(vendor_id),
    pickup_location_id VARCHAR(50) NOT NULL REFERENCES locations(location_id),
    delivery_location_id VARCHAR(50) NOT NULL REFERENCES locations(location_id),
    equipment_type VARCHAR(30) NOT NULL, -- 40HC, 40RH, 20DC...
    buy_rate NUMERIC(15, 2) NOT NULL CHECK (buy_rate > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    validity_range DATERANGE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- P0.1: Ràng buộc chỉ chặn khi CÙNG 1 VENDOR bị chồng lấn ngày trên cùng tuyến/loại xe
    CONSTRAINT exclude_overlapping_vendor_road_rates EXCLUDE USING gist (
        vendor_id WITH =,
        pickup_location_id WITH =,
        delivery_location_id WITH =,
        equipment_type WITH =,
        validity_range WITH &&
    ) WHERE (status = 'APPROVED')
);

CREATE INDEX IF NOT EXISTS idx_road_rates_lookup 
ON road_rates(pickup_location_id, delivery_location_id, equipment_type, status);

-- --------------------------------------------------------------------
-- 4. QUOTATION SYSTEM (BÁO GIÁ THƯƠNG MẠI)
-- --------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS quotation_no_seq START WITH 10001;

CREATE TABLE IF NOT EXISTS customer_quotations (
    quotation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_no VARCHAR(50) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(customer_id),
    region_id VARCHAR(50) NOT NULL REFERENCES regions(region_id),
    commodity_id VARCHAR(50) REFERENCES commodities(commodity_id),
    status "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    
    -- Tổng giá trị P&L kế hoạch
    total_sell_amount NUMERIC(15, 2) DEFAULT 0,
    total_estimated_buy NUMERIC(15, 2) DEFAULT 0,
    total_worst_case_buy NUMERIC(15, 2) DEFAULT 0,
    estimated_gp NUMERIC(15, 2) DEFAULT 0,
    estimated_margin_percent NUMERIC(5, 2) DEFAULT 0,
    
    currency VARCHAR(3) DEFAULT 'VND',
    payment_terms_days INT DEFAULT 30,
    valid_until DATE,
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    immutable_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_quotation_no_version UNIQUE (quotation_no, version)
);

-- P0.2: Ancillary services chỉ tạo qua các dòng dịch vụ này
CREATE TABLE IF NOT EXISTS quotation_service_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES customer_quotations(quotation_id) ON DELETE CASCADE,
    service_package VARCHAR(50) NOT NULL,
    pricing_inclusion "PricingInclusion" DEFAULT 'INCLUDED',
    origin_location_id VARCHAR(50) REFERENCES locations(location_id),
    destination_location_id VARCHAR(50) REFERENCES locations(location_id),
    equipment_type VARCHAR(30),
    planned_quantity NUMERIC(10, 2) DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'TRIP',
    
    unit_sell_price NUMERIC(15, 2) DEFAULT 0,
    total_sell_price NUMERIC(15, 2) DEFAULT 0,
    
    selected_buy_rate_id UUID,
    estimated_buy_amount NUMERIC(15, 2) DEFAULT 0,
    worst_case_buy_amount NUMERIC(15, 2) DEFAULT 0,
    
    item_gp NUMERIC(15, 2) DEFAULT 0,
    item_margin_percent NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4.3. Snapshot Giá Mua NCC (Bảo vệ tính bất biến của Báo giá)
CREATE TABLE IF NOT EXISTS quotation_buy_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES customer_quotations(quotation_id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES quotation_service_items(item_id) ON DELETE CASCADE,
    source_rate_id UUID NOT NULL,
    vendor_id VARCHAR(50) NOT NULL REFERENCES vendors(vendor_id),
    vendor_name VARCHAR(255) NOT NULL,
    rate_amount NUMERIC(15, 2) NOT NULL,
    original_currency VARCHAR(3) NOT NULL,
    fx_rate_to_vnd NUMERIC(12, 4) DEFAULT 1.0000,
    rate_amount_vnd NUMERIC(15, 2) NOT NULL,
    validity_start DATE NOT NULL,
    validity_end DATE NOT NULL,
    snapshot_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4.4. Nhật ký Thẩm định & Phê duyệt (Approval Log)
CREATE TABLE IF NOT EXISTS quotation_approval_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES customer_quotations(quotation_id),
    version INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_id VARCHAR(100) NOT NULL,
    actor_name VARCHAR(255),
    comment TEXT,
    snapshot_margin_percent NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 5. ORDERS & FULFILLMENT TABLES (P1.6 & P1.7)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_no VARCHAR(50) NOT NULL UNIQUE,
    quotation_id UUID NOT NULL REFERENCES customer_quotations(quotation_id),
    quotation_version INT NOT NULL,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(customer_id),
    region_id VARCHAR(50) NOT NULL REFERENCES regions(region_id),
    status "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
    
    revenue_vnd NUMERIC(15, 2) DEFAULT 0,
    cost_vnd NUMERIC(15, 2) DEFAULT 0,
    gp_vnd NUMERIC(15, 2) DEFAULT 0,
    margin_percent NUMERIC(5, 2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_service_items (
    order_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    service_package VARCHAR(50) NOT NULL,
    origin_location_id VARCHAR(50) REFERENCES locations(location_id),
    destination_location_id VARCHAR(50) REFERENCES locations(location_id),
    equipment_type VARCHAR(30),
    
    -- P1.7: Hỗ trợ Partial Release
    planned_trip_qty INT NOT NULL DEFAULT 1,
    released_trip_qty INT NOT NULL DEFAULT 0,
    
    sell_amount_vnd NUMERIC(15, 2) DEFAULT 0,
    estimated_buy_vnd NUMERIC(15, 2) DEFAULT 0,
    actual_buy_vnd NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- P1.6: Ocean Order chỉ tạo Work Request; Sea Shipment hình thành khi có dữ liệu tàu thực tế
CREATE TABLE IF NOT EXISTS ocean_work_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id),
    order_item_id UUID NOT NULL REFERENCES order_service_items(order_item_id),
    pol_location_id VARCHAR(50) NOT NULL REFERENCES locations(location_id),
    pod_location_id VARCHAR(50) NOT NULL REFERENCES locations(location_id), -- P0.4: POD = Port of Discharge
    equipment_type VARCHAR(30) NOT NULL,
    container_qty INT NOT NULL DEFAULT 1,
    status VARCHAR(30) DEFAULT 'PENDING_BOOKING',
    booking_no VARCHAR(100),
    sea_shipment_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- P1.7: Shipping Orders sinh khi bấm "Release to Operations"
CREATE TABLE IF NOT EXISTS shipping_orders (
    shipping_order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_order_no VARCHAR(50) NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES orders(order_id),
    order_item_id UUID NOT NULL REFERENCES order_service_items(order_item_id),
    vendor_id VARCHAR(50) REFERENCES vendors(vendor_id),
    pickup_location_id VARCHAR(50) NOT NULL REFERENCES locations(location_id),
    delivery_location_id VARCHAR(50) NOT NULL REFERENCES locations(location_id),
    equipment_type VARCHAR(30),
    container_no VARCHAR(50),
    seal_no VARCHAR(50),
    sea_ref_id VARCHAR(100),
    status "ShippingOrderStatus" NOT NULL DEFAULT 'DRAFT',
    
    -- P0.4: Delivery Proof thay thế cho Proof of Delivery
    delivery_proof_file TEXT,
    delivery_proof_verified BOOLEAN DEFAULT FALSE,
    delivery_proof_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 6. INVOICE LEVEL AR/AP MANAGEMENT & ALLOCATION (P0.5)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(customer_id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount_vnd NUMERIC(15, 2) NOT NULL,
    settled_amount_vnd NUMERIC(15, 2) DEFAULT 0,
    open_balance_vnd NUMERIC(15, 2) NOT NULL,
    status "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_invoice_allocations (
    allocation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES customer_invoices(invoice_id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(order_id),
    order_item_id UUID REFERENCES order_service_items(order_item_id),
    allocated_amount_vnd NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no VARCHAR(50) NOT NULL,
    vendor_id VARCHAR(50) NOT NULL REFERENCES vendors(vendor_id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount_vnd NUMERIC(15, 2) NOT NULL,
    paid_amount_vnd NUMERIC(15, 2) DEFAULT 0,
    open_balance_vnd NUMERIC(15, 2) NOT NULL,
    status "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_invoice_allocations (
    allocation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES vendor_invoices(invoice_id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(order_id),
    shipping_order_id UUID REFERENCES shipping_orders(shipping_order_id),
    allocated_amount_vnd NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

