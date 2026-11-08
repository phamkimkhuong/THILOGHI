-- ====================================================================
-- BẢNG BIỂU PHÍ CỬA KHẨU & BÃI KIỂM HÓA LIÊN VẬN (BORDER RATES)
-- Phục vụ: Quản lý giá mua đầu vào tác nghiệp tại Cửa khẩu Quốc tế (Việt - Lào, Việt - CPC)
-- Nguồn dữ liệu: REVENUE MANAGEMENT.xlsx (Sheet Border_Gate)
-- ====================================================================

CREATE TABLE IF NOT EXISTS border_rates (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    border_pair_id VARCHAR(50) NOT NULL,
    border_pair_name VARCHAR(100) NOT NULL,
    country_pair VARCHAR(50) NOT NULL DEFAULT 'Việt - Lào',
    provinces VARCHAR(100),
    commodity_name VARCHAR(100) NOT NULL DEFAULT 'Tất cả loại hàng',
    infrastructure_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    entry_exit_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    customs_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    validity_range DATERANGE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_border_rates_lookup 
ON border_rates (border_pair_id, country_pair, commodity_name, status);

-- Seed 10 biểu phí cửa khẩu chuẩn hóa từ REVENUE MANAGEMENT.xlsx
INSERT INTO border_rates (
    border_pair_id, border_pair_name, country_pair, provinces, commodity_name,
    infrastructure_fee, entry_exit_fee, customs_fee, total_fee, currency,
    validity_range, status, notes
) VALUES
('BOY-PHU', 'Bờ Y – Phu Kua', 'Việt - Lào', 'Kon Tum – Attapeu', 'Quả chuối tươi', 700000, 250000, 1200000, 2150000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Cửa khẩu Bờ Y phục vụ xuất nhập khẩu chuối nông trường Attapeu'),
('BOY-PHU', 'Bờ Y – Phu Kua', 'Việt - Lào', 'Kon Tum – Attapeu', 'Tinh bột sắn', 700000, 250000, 1200000, 2150000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Cửa khẩu Bờ Y vận chuyển tinh bột sắn liên vận'),
('BOY-PHU', 'Bờ Y – Phu Kua', 'Việt - Lào', 'Kon Tum – Attapeu', 'Frozen Fish', 700000, 250000, 1200000, 2150000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Thủy hải sản đông lạnh qua Cửa khẩu Bờ Y'),
('LAB-DAN', 'Lao Bảo – Dansavanh', 'Việt - Lào', 'Quảng Trị – Savannakhet', 'Ván lạng', 385000, 200000, 1200000, 1785000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Tuyến hành lang kinh tế Đông - Tây qua Lao Bảo'),
('CHAL-NAP', 'Cha Lo – Naphao', 'Việt - Lào', 'Quảng Bình – Khammouane', 'Nông sản & Khoáng sản', 385000, 200000, 1200000, 1785000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Cửa khẩu Cha Lo liên vận hàng hóa Trung - Hạ Lào'),
('NAMG-DAC', 'Nam Giang – Đắc Ta Oóc', 'Việt - Lào', 'Quảng Nam – Sekong', 'Nông sản & Quặng', 385000, 200000, 1200000, 1785000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Tuyến kết nối trực tiếp Quảng Nam - Cảng Chu Lai với Sekong'),
('CAUT-NAPH', 'Cầu Treo – Nam Phao', 'Việt - Lào', 'Hà Tĩnh – Khammouane', 'Hàng bách hóa & Nông sản', 385000, 200000, 1200000, 1785000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Cửa khẩu Quốc tế Cầu Treo vận chuyển liên vận'),
('LALAY', 'La Lay – La Lay', 'Việt - Lào', 'Quảng Trị – Salavan', 'Than đá & Nông sản', 500000, 200000, 1200000, 1900000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Tuyến chuyên dụng than đá và nông lâm sản Salavan về Chu Lai'),
('LET-OYA', 'Lệ Thanh – Oyadav', 'Việt - CPC', 'Gia Lai – Ratanakiri', 'Quả chuối tươi', 500000, 170000, 1200000, 1870000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Cửa khẩu Lệ Thanh kết nối nông trường Ratanakiri Campuchia'),
('MOBA-BAV', 'Mộc Bài – Bavet', 'Việt - CPC', 'Tây Ninh – Svay Rieng', 'Hàng công nghiệp & Nông sản', 500000, 200000, 1200000, 1900000, 'VND', daterange('2026-01-01', '2027-01-01', '[)'), 'ACTIVE', 'Cửa khẩu Mộc Bài cửa ngõ giao thương Campuchia')
ON CONFLICT DO NOTHING;

