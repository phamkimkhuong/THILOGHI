-- ====================================================================
-- MIGRATION PHASE 11: BẢNG BIỂU PHÍ BẢO HIỂM HÀNG HÓA (INSURANCE RATES)
-- Phục vụ: Quản lý định mức chi phí mua bảo hiểm rủi ro hàng hóa đường bộ, đường biển, đa phương thức
-- Nguồn quy chuẩn: THILOGI_INSURANCE_SERVICE_TRAINING.docx & REVENUE MANAGEMENT.xlsx (Sheet Other)
-- Khởi tạo rỗng để Admin/Pricing tự nhập biểu phí thực tế
-- ====================================================================

CREATE TABLE IF NOT EXISTS insurance_rates (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insurer_id VARCHAR(50) NOT NULL REFERENCES partners(partner_id),
    insurer_name VARCHAR(255) NOT NULL,
    coverage_type VARCHAR(50) NOT NULL DEFAULT 'ALL_RISKS',
    transport_mode VARCHAR(50) NOT NULL DEFAULT 'MULTIMODAL',
    commodity_id VARCHAR(50) REFERENCES commodities(commodity_id),
    commodity_name VARCHAR(255) NOT NULL DEFAULT 'Tất cả loại hàng',
    pricing_model VARCHAR(50) NOT NULL DEFAULT 'FIXED_PER_SHIPMENT',
    rate_basis VARCHAR(50) NOT NULL DEFAULT 'PER_CONTAINER',
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    rate_percent NUMERIC(6, 4) NOT NULL DEFAULT 0,
    min_premium_vnd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    deductible_vnd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    max_insured_value_vnd NUMERIC(15, 2),
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    validity_range DATERANGE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insurance_rates_lookup 
ON insurance_rates (insurer_id, coverage_type, transport_mode, commodity_id, status);

