-- ====================================================================
-- MIGRATION PHASE 12: BẢNG BIỂU PHÍ DỊCH VỤ KHÁC CÓ KIỂM SOÁT (OTHER RATES)
-- Phục vụ: Quản lý định mức chi phí các dịch vụ bổ sung ngoài 7 gói chuẩn (SURVEY, SPECIAL_EQUIPMENT, DOCUMENT_DELIVERY, ESCORT, OTHER_TEMPORARY)
-- Nguồn quy chuẩn: THILOGI_OTHER_SERVICES_TRAINING.docx (03/10/2026)
-- Khởi tạo rỗng (0 mock rows) để Admin/Pricing tự nhập biểu phí thực tế
-- ====================================================================

CREATE TABLE IF NOT EXISTS other_rates (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_code VARCHAR(50) NOT NULL, -- SURVEY, SPECIAL_EQUIPMENT, DOCUMENT_DELIVERY, ESCORT, OTHER_TEMPORARY
    service_name VARCHAR(255) NOT NULL, -- Tên hiển thị chi tiết nghiệp vụ
    provider_id VARCHAR(50) NOT NULL REFERENCES partners(partner_id),
    provider_name VARCHAR(255) NOT NULL,
    pricing_method VARCHAR(50) NOT NULL DEFAULT 'FIXED', -- FIXED, UNIT_RATE, ACTUAL
    rate_basis VARCHAR(50) NOT NULL DEFAULT 'LOT', -- LOT, SET, SHIFT, HOUR, TRIP, KM, ACTUAL_RECEIPT
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    evidence_required BOOLEAN NOT NULL DEFAULT false, -- Có yêu cầu biên lai / chứng từ đính kèm
    validity_range DATERANGE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_other_rates_lookup 
ON other_rates (service_code, provider_id, pricing_method, status);

