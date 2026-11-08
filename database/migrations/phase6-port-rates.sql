-- ====================================================================
-- BẢNG BIỂU PHÍ CẢNG & DEPOT CHU LAI (PORT RATES)
-- Phục vụ: Quản lý giá mua đầu vào tác nghiệp tại Cảng Chu Lai / Depot
-- ====================================================================

CREATE TABLE IF NOT EXISTS port_rates (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    port_code VARCHAR(50) NOT NULL DEFAULT 'CHU_LAI',
    port_name VARCHAR(100) NOT NULL DEFAULT 'Cảng Chu Lai',
    service_category VARCHAR(100) NOT NULL,
    charge_code VARCHAR(50) NOT NULL,
    cargo_type VARCHAR(50) NOT NULL DEFAULT 'Loaded',
    container_type VARCHAR(30) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'Cont',
    unit_price NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    validity_range DATERANGE NOT NULL DEFAULT daterange('2026-01-01', '2027-01-01', '[)'),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_port_rates_lookup 
ON port_rates (port_code, charge_code, container_type, cargo_type, status);

-- Seed 12 biểu phí chuẩn hóa của Cảng Chu Lai từ REVENUE MANAGEMENT.xlsx
INSERT INTO port_rates (port_code, port_name, service_category, charge_code, cargo_type, container_type, unit, unit_price, currency, validity_range, status, notes)
VALUES
('CHU_LAI', 'Cảng Chu Lai', 'Phí xếp dỡ container', 'LOLO', 'Empty', '20GP', 'Cont', 350000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Nâng hạ container rỗng 20 feet tiêu chuẩn'),
('CHU_LAI', 'Cảng Chu Lai', 'Phí xếp dỡ container', 'LOLO', 'Empty', '20HR', 'Cont', 350000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Nâng hạ container rỗng 20 feet lạnh'),
('CHU_LAI', 'Cảng Chu Lai', 'Phí xếp dỡ container', 'LOLO', 'Empty', '40HC', 'Cont', 450000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Nâng hạ container rỗng 40 feet cao'),
('CHU_LAI', 'Cảng Chu Lai', 'Phí xếp dỡ container', 'LOLO', 'Empty', '40HR', 'Cont', 450000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Nâng hạ container rỗng 40 feet lạnh'),
('CHU_LAI', 'Cảng Chu Lai', 'Phí xếp dỡ container', 'LOLO', 'Loaded', '20GP', 'Cont', 450000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Nâng hạ container có hàng 20 feet tiêu chuẩn'),
('CHU_LAI', 'Cảng Chu Lai', 'Phí xếp dỡ container', 'LOLO', 'Loaded', '20HR', 'Cont', 675000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Nâng hạ container có hàng 20 feet lạnh (nông sản/thủy sản)'),
('CHU_LAI', 'Cảng Chu Lai', 'Phí xếp dỡ container', 'LOLO', 'Loaded', '40HC', 'Cont', 500000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Nâng hạ container có hàng 40 feet cao'),
('CHU_LAI', 'Cảng Chu Lai', 'Phí xếp dỡ container', 'LOLO', 'Loaded', '40HR', 'Cont', 750000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Nâng hạ container có hàng 40 feet lạnh'),
('CHU_LAI', 'Cảng Chu Lai', 'Phí xếp dỡ container', 'THC_PORT', 'Loaded', '20HR', 'Cont', 100, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'THC cảng container lạnh 20HR thu bằng USD'),
('CHU_LAI', 'Cảng Chu Lai', 'Phí xếp dỡ container', 'THC_PORT', 'Loaded', '40HR', 'Cont', 125, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'THC cảng container lạnh 40HR thu bằng USD'),
('CHU_LAI', 'Cảng Chu Lai', 'Phí cấp điện lạnh', 'POWER', 'Loaded', '40HR', 'Giờ', 0.5, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Phí cắm điện container lạnh tại bãi cảng Chu Lai (0.5 USD/h)'),
('CHU_LAI', 'Cảng Chu Lai', 'Phí lưu bãi container', 'STORAGE', 'Loaded', 'ALL', 'Ngày', 50000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Phí lưu bãi container sau thời gian miễn phí')
ON CONFLICT DO NOTHING;

