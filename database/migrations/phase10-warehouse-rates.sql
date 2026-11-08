-- ====================================================================
-- MIGRATION PHASE 10: BẢNG BIỂU PHÍ DỊCH VỤ KHO BÃI & LƯU TRỮ (WAREHOUSE RATES)
-- Phục vụ: Quản lý giá mua đầu vào các dịch vụ lưu kho, bốc dỡ, soạn hàng, kho lạnh
-- Nguồn quy chuẩn: THILOGI_WAREHOUSING_SERVICE_TRAINING.docx
-- Khởi tạo rỗng để Admin/Pricing tự nhập biểu phí thực tế
-- ====================================================================

CREATE TABLE IF NOT EXISTS warehouse_rates (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id VARCHAR(50) NOT NULL REFERENCES locations(location_id),
    warehouse_name VARCHAR(255) NOT NULL,
    provider_id VARCHAR(50) NOT NULL REFERENCES partners(partner_id),
    provider_name VARCHAR(255) NOT NULL,
    warehouse_type VARCHAR(50) NOT NULL DEFAULT 'DRY',
    service_code VARCHAR(50) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    commodity_id VARCHAR(50) REFERENCES commodities(commodity_id),
    commodity_name VARCHAR(255) NOT NULL DEFAULT 'Tất cả loại hàng',
    rate_basis VARCHAR(50) NOT NULL DEFAULT 'TON_DAY',
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    free_days INT NOT NULL DEFAULT 0,
    min_storage_days INT NOT NULL DEFAULT 1,
    min_charge_vnd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    validity_range DATERANGE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warehouse_rates_lookup 
ON warehouse_rates (warehouse_id, service_code, warehouse_type, commodity_id, status);

