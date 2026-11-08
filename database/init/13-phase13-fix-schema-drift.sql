-- ====================================================================
-- PHASE 13: KHẮC PHỤC SCHEMA DRIFT & CHUẨN HÓA DATA CONTRACT BÁO GIÁ
-- 1. Bổ sung customer_quotations.pricing_date
-- 2. Bổ sung quotation_service_items.insured_value cho bảo hiểm hàng hóa
-- 3. Chuẩn hóa quotation_buy_snapshots: cho phép vendor_id nullable đối với biểu phí hành chính/cảng/cửa khẩu
-- 4. Bổ sung cost_source_id, cost_source_type trong quotation_buy_snapshots
-- 5. Loại bỏ thuật ngữ D2D, D2P, P2D khỏi master_services
-- ====================================================================

-- 1. Cột pricing_date trên bảng customer_quotations
ALTER TABLE customer_quotations 
ADD COLUMN IF NOT EXISTS pricing_date DATE DEFAULT CURRENT_DATE;

UPDATE customer_quotations 
SET pricing_date = COALESCE(created_at::date, CURRENT_DATE) 
WHERE pricing_date IS NULL;

-- 2. Cột insured_value trên quotation_service_items
ALTER TABLE quotation_service_items 
ADD COLUMN IF NOT EXISTS insured_value NUMERIC(15, 2);

-- 3. Chuẩn hóa quotation_buy_snapshots
-- vendor_id có thể NULL khi nguồn giá là Đơn vị quản lý Cửa khẩu hoặc Cảng (không phải vendor trong danh mục đối tác)
ALTER TABLE quotation_buy_snapshots 
ALTER COLUMN vendor_id DROP NOT NULL;

ALTER TABLE quotation_buy_snapshots 
ADD COLUMN IF NOT EXISTS cost_source_id VARCHAR(100);

ALTER TABLE quotation_buy_snapshots 
ADD COLUMN IF NOT EXISTS cost_source_type VARCHAR(50) DEFAULT 'VENDOR';

-- Backfill cost_source_id từ vendor_id nếu đang NULL
UPDATE quotation_buy_snapshots 
SET cost_source_id = vendor_id, cost_source_type = 'VENDOR' 
WHERE cost_source_id IS NULL;

-- 4. Làm sạch mô tả D2D, D2P, P2D khỏi bảng services
UPDATE services 
SET description = 'Di chuyển hàng bằng phương tiện đường bộ (xe đầu kéo, xe tải thùng, xe chuyên dụng) nội địa & liên vận quốc tế.',
    updated_at = CURRENT_TIMESTAMP
WHERE service_id = 'TRUCKING';