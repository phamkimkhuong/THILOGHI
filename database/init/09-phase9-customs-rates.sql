-- ====================================================================
-- BẢNG BIỂU PHÍ DỊCH VỤ HẢI QUAN & THỦ TỤC THÔNG QUAN (CUSTOMS RATES)
-- Phục vụ: Quản lý giá mua đầu vào dịch vụ khai thuê Hải quan, kiểm dịch, kiểm hóa
-- Tài liệu đặc tả: THILOGI_CUSTOMS_XNK_SERVICE_TRAINING.docx & REVENUE MANAGEMENT.xlsx
-- Lưu ý: Không nạp dữ liệu seed giả. Bảng khởi tạo rỗng để Admin/Pricing tự nhập.
-- ====================================================================

CREATE TABLE IF NOT EXISTS customs_rates (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id VARCHAR(50) NOT NULL REFERENCES partners(partner_id),
    provider_name VARCHAR(255) NOT NULL,
    customs_office_id VARCHAR(50) NOT NULL REFERENCES locations(location_id),
    customs_office_name VARCHAR(255) NOT NULL,
    country_code VARCHAR(10) NOT NULL DEFAULT 'VN',
    customs_procedure VARCHAR(50) NOT NULL, -- EXPORT, IMPORT, TRANSIT, TEMP_IMPORT_REEXPORT, TEMP_EXPORT_REIMPORT
    service_code VARCHAR(50) NOT NULL, -- DECLARATION, INSPECTION, QUARANTINE, PERMIT, LIQUIDATION
    service_name VARCHAR(255) NOT NULL,
    commodity_id VARCHAR(50) REFERENCES commodities(commodity_id),
    commodity_name VARCHAR(255) NOT NULL DEFAULT 'Tất cả loại hàng',
    rate_basis VARCHAR(50) NOT NULL DEFAULT 'PER_DECLARATION', -- PER_DECLARATION, PER_CONTAINER, PER_TRUCK, PER_TON, PER_LOT
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    validity_range DATERANGE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customs_rates_lookup 
ON customs_rates (customs_office_id, customs_procedure, service_code, commodity_id, status);

