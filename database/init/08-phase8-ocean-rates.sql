-- ====================================================================
-- BẢNG BIỂU CƯỚC VẬN TẢI BIỂN QUỐC TẾ & NỘI ĐỊA (OCEAN RATES)
-- Phục vụ: Quản lý giá mua đầu vào vận tải đường biển quốc tế (Chu Lai - Trung Quốc, Hàn Quốc...) & feeder nội địa
-- Nguồn dữ liệu: REVENUE MANAGEMENT.xlsx (Sheet Ocean_Service)
-- ====================================================================

-- 1. Đảm bảo có cảng Nansha (CNNSA) trong danh mục locations
INSERT INTO locations (
    location_id, code, name, location_type, region_id, country_code, province, address, status, is_active
) VALUES (
    'CNNSA', 'CNNSA', 'NANSHA PORT', 'Port', 'REG_MB', 'CN', 'Guangdong', 'Nansha Port, Guangzhou, China', 'Active', true
) ON CONFLICT (location_id) DO NOTHING;

-- 2. Tạo bảng ocean_rates
CREATE TABLE IF NOT EXISTS ocean_rates (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id VARCHAR(50) NOT NULL,
    carrier_name VARCHAR(100) NOT NULL,
    pol_id VARCHAR(50) NOT NULL,
    pol_name VARCHAR(100) NOT NULL,
    pod_id VARCHAR(50) NOT NULL,
    pod_name VARCHAR(100) NOT NULL,
    commodity_name VARCHAR(100) NOT NULL DEFAULT 'Fresh Bananas',
    container_type VARCHAR(30) NOT NULL DEFAULT '40HR',
    ocean_freight_usd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    thc_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    docs_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    seal_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    afs_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    telex_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    baf_caf_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    other_surcharges NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_charges_vnd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    validity_range DATERANGE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ocean_rates_lookup 
ON ocean_rates (carrier_id, pol_id, pod_id, container_type, commodity_name, status);

-- 3. Seed 12 biểu cước vận tải biển chuẩn hóa từ REVENUE MANAGEMENT.xlsx
INSERT INTO ocean_rates (
    carrier_id, carrier_name, pol_id, pol_name, pod_id, pod_name,
    commodity_name, container_type, ocean_freight_usd, thc_fee, docs_fee,
    seal_fee, afs_fee, telex_fee, baf_caf_fee, other_surcharges,
    total_charges_vnd, currency, validity_range, status, notes
) VALUES
-- SITC
('SITC', 'SITC Maritime Group', 'VNTAP', 'CHU LAI PORT', 'CNDLC', 'DALIAN PORT', 'Quả chuối tươi', '40HR', 800, 0, 950000, 190000, 665000, 570000, 0, 0, 22935000, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Cước biển chuyên tuyến container lạnh Chu Lai - Đại Liên hãng tàu SITC'),
('SITC', 'SITC Maritime Group', 'VNTAP', 'CHU LAI PORT', 'CNSHK', 'SHEKOU PORT', 'Quả chuối tươi', '40HR', 700, 0, 950000, 190000, 665000, 570000, 0, 0, 20365000, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Cước biển Chu Lai - Xà Khẩu SITC'),
('SITC', 'SITC Maritime Group', 'VNTAP', 'CHU LAI PORT', 'CNXGA', 'XINGANG PORT', 'Quả chuối tươi', '40HR', 880, 0, 950000, 190000, 665000, 570000, 0, 0, 24991000, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Cước biển Chu Lai - Tân Cảng (Thiên Tân) SITC'),

-- RCL
('RCL', 'Regional Container Lines', 'VNTAP', 'CHU LAI PORT', 'CNNSA', 'NANSHA PORT', 'Quả chuối tươi', '40HR', 700, 0, 1000000, 220000, 665000, 620000, 0, 0, 20495000, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Tuyến container lạnh Nam Sa (Quảng Châu) hãng tàu RCL'),
('RCL', 'Regional Container Lines', 'VNTAP', 'CHU LAI PORT', 'CNSHA', 'SHANGHAI PORT', 'Quả chuối tươi', '40HR', 700, 0, 1000000, 220000, 665000, 620000, 0, 0, 20495000, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Tuyến container lạnh Thượng Hải hãng tàu RCL'),
('RCL', 'Regional Container Lines', 'VNTAP', 'CHU LAI PORT', 'CNNSA', 'NANSHA PORT', 'Thủy sản đông lạnh', '40HR', 600, 0, 1000000, 220000, 665000, 620000, 0, 0, 17925000, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Thủy sản đông lạnh xuất khẩu Nam Sa'),
('RCL', 'Regional Container Lines', 'VNTAP', 'CHU LAI PORT', 'CNSHA', 'SHANGHAI PORT', 'Thủy sản đông lạnh', '40HR', 750, 0, 1000000, 220000, 665000, 620000, 0, 0, 21780000, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Thủy sản đông lạnh xuất khẩu Thượng Hải'),
('RCL', 'Regional Container Lines', 'VNTAP', 'CHU LAI PORT', 'CNNSA', 'NANSHA PORT', 'Tinh bột sắn', '40HC', 130, 0, 1000000, 220000, 0, 620000, 0, 0, 5181000, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Tinh bột sắn container khô 40HC đi Nam Sa'),
('RCL', 'Regional Container Lines', 'VNTAP', 'CHU LAI PORT', 'CNQZH', 'QINZHOU PORT', 'Tinh bột sắn', '40HC', 800, 0, 1000000, 220000, 0, 620000, 0, 0, 22400000, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Tinh bột sắn xuất khẩu Khâm Châu'),

-- CMA
('CMA', 'CMA CGM VIETNAM JSC', 'VNTAP', 'CHU LAI PORT', 'CNDLC', 'DALIAN PORT', 'Quả chuối tươi', '40HR', 650, 0, 950000, 230000, 665000, 500000, 0, 0, 19050000, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Tuyến container lạnh Đại Liên hãng tàu CMA CGM'),
('CMA', 'CMA CGM VIETNAM JSC', 'VNTAP', 'CHU LAI PORT', 'CNSHK', 'SHEKOU PORT', 'Quả chuối tươi', '40HR', 1100, 0, 950000, 230000, 665000, 500000, 0, 0, 30615000, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Tuyến container lạnh Xà Khẩu hãng tàu CMA CGM'),

-- THILOGI Feeder nội địa
('THL', 'CÔNG TY TNHH VẬN TẢI BIỂN THILOGI', 'VNTAP', 'CHU LAI PORT', 'VNDTS', 'TIÊN SA PORT', 'Hàng tổng hợp', '40HC', 150, 0, 500000, 100000, 0, 0, 0, 0, 4455000, 'USD', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Tuyến feeder ven biển Chu Lai - Tiên Sa kết nối tàu mẹ quốc tế')
ON CONFLICT DO NOTHING;
