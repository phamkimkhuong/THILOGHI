-- ====================================================================
-- BẢNG DANH MỤC 8 GÓI DỊCH VỤ CHUẨN THILOGI LOGISTICS OS
-- Phục vụ: Quản lý Danh mục Dịch vụ & Lập báo giá chuỗi đa phương thức
-- ====================================================================

CREATE TABLE IF NOT EXISTS services (
    service_id VARCHAR(50) PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(50) NOT NULL,
    description TEXT,
    default_unit VARCHAR(20) DEFAULT 'TRIP',
    pricing_type VARCHAR(30) DEFAULT 'ROUTE_BASED',
    is_core_transport BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    typical_charges JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed 8 Gói dịch vụ chuẩn hoá theo THILOGI_8_GOI_DICH_VU_TRAINING
INSERT INTO services (service_id, service_name, service_category, description, default_unit, pricing_type, is_core_transport, is_active, sort_order, typical_charges)
VALUES
(
    'TRUCKING',
    'Vận tải đường bộ',
    'CORE_TRANSPORT',
    'Di chuyển hàng bằng phương tiện đường bộ (xe đầu kéo, xe tải thùng, xe chuyên dụng) nội địa & liên vận quốc tế.',
    'TRIP',
    'ROUTE_BASED',
    true,
    true,
    1,
    '["ROAD_FREIGHT", "OVERWEIGHT_SURCHARGE", "DETENTION_FEE"]'::jsonb
),
(
    'OCEAN',
    'Vận tải biển',
    'CORE_TRANSPORT',
    'Vận chuyển đường biển từ cảng xếp POL đến cảng dỡ POD. Quản lý cước tàu và các phụ phí hãng tàu (LCC/THC/BAF/CAF).',
    'CONT',
    'ROUTE_BASED',
    true,
    true,
    2,
    '["OCEAN_FREIGHT", "THC_SHIPPING_LINE", "DOCS", "SEAL", "BAF", "CAF", "CIC"]'::jsonb
),
(
    'PORT',
    'Cảng & Depot',
    'PORT_DEPOT',
    'Tác nghiệp container và hàng hóa tại Cảng Chu Lai, Terminal và Container Depot nội bộ hoặc thuê ngoài.',
    'CONT',
    'UNIT_BASED',
    false,
    true,
    3,
    '["LOLO", "POWER_CHARGE", "THC_PORT", "TRANSLOADING", "STORAGE_YARD", "CARGO_HANDLING"]'::jsonb
),
(
    'CUSTOMS',
    'Xuất nhập khẩu & Hải quan',
    'CLEARANCE',
    'Thực hiện thủ tục hải quan, mở tờ khai XNK, thông quan quá cảnh, xin giấy phép C/O, kiểm định chuyên ngành.',
    'DECLARATION',
    'UNIT_BASED',
    false,
    true,
    4,
    '["PER_DECLARATION", "PER_TRUCK", "QUARANTINE_FEE", "INFRASTRUCTURE_FEE", "ENTRY_EXIT_FEE"]'::jsonb
),
(
    'BORDER_GATE',
    'Cửa khẩu & Bãi kiểm hóa',
    'CLEARANCE',
    'Tác nghiệp hiện trường tại các cặp cửa khẩu Việt - Lào - Campuchia (Bờ Y, Nam Giang, Cha Lo...). Ra vào bãi, trạm cân, sang xe.',
    'TRUCK',
    'UNIT_BASED',
    false,
    true,
    5,
    '["BORDER_INFRASTRUCTURE", "YARD_ENTRY_EXIT", "WEIGHING_FEE", "BORDER_HANDLING", "TRANSIT_FEE"]'::jsonb
),
(
    'WAREHOUSING',
    'Kho bãi & Lưu trữ',
    'WAREHOUSE',
    'Lưu giữ và xử lý hàng hóa tại hệ thống kho Chu Lai (Kho tổng hợp, kho CFS, kho ngoại quan, kho lạnh).',
    'TON/DAY',
    'UNIT_BASED',
    false,
    true,
    6,
    '["STORAGE", "INBOUND_HANDLING", "OUTBOUND_HANDLING", "LOADING_UNLOADING", "COLD_STORAGE", "PALLETIZING"]'::jsonb
),
(
    'INSURANCE',
    'Bảo hiểm hàng hóa',
    'VALUE_ADDED',
    'Bảo hiểm rủi ro hàng hóa trong quá trình vận chuyển đường bộ, đường biển hoặc đa phương thức.',
    'SHIPMENT',
    'UNIT_BASED',
    false,
    true,
    7,
    '["CARGO_INSURANCE_PREMIUM", "MINIMUM_PREMIUM", "SURVEY_FEE"]'::jsonb
),
(
    'OTHER',
    'Dịch vụ khác có kiểm soát',
    'VALUE_ADDED',
    'Dịch vụ bổ trợ đặc thù có mã kiểm soát: giám định chất lượng, phương tiện hộ tống, dán tem nhãn, hoa hồng.',
    'LOT',
    'UNIT_BASED',
    false,
    true,
    8,
    '["SURVEY", "SPECIAL_EQUIPMENT", "ESCORT", "DOCUMENT_DELIVERY", "COMMISSION"]'::jsonb
)
ON CONFLICT (service_id) DO UPDATE SET
    service_name = EXCLUDED.service_name,
    service_category = EXCLUDED.service_category,
    description = EXCLUDED.description,
    default_unit = EXCLUDED.default_unit,
    pricing_type = EXCLUDED.pricing_type,
    is_core_transport = EXCLUDED.is_core_transport,
    sort_order = EXCLUDED.sort_order,
    typical_charges = EXCLUDED.typical_charges,
    updated_at = CURRENT_TIMESTAMP;

