-- ====================================================================
-- MIGRATION PHASE 14: CẤU PHẦN CHI PHÍ GIÁ MUA ĐẦU VÀO (COST COMPONENTS)
-- Phục vụ: Quản lý chi tiết từng cấu phần chi phí BUY cấu thành dịch vụ logistics
-- Cho phép tính chính xác Estimated BUY và Worst-case BUY (không bị mất chi phí phụ bắt buộc)
-- ====================================================================

CREATE TABLE IF NOT EXISTS quotation_item_cost_components (
    component_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES customer_quotations(quotation_id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES quotation_service_items(item_id) ON DELETE CASCADE,
    cost_code VARCHAR(50) NOT NULL,
    cost_name VARCHAR(255) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT true,
    rate_source_id UUID,
    vendor_id VARCHAR(50) REFERENCES vendors(vendor_id),
    cost_source_id VARCHAR(100),
    vendor_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit VARCHAR(30) NOT NULL DEFAULT 'TRIP',
    rate_basis VARCHAR(50) NOT NULL DEFAULT 'PER_CONTAINER',
    original_currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    original_rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
    fx_rate_to_vnd NUMERIC(12, 4) NOT NULL DEFAULT 1.0000,
    unit_cost_vnd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    estimated_cost_vnd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    worst_case_cost_vnd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cost_components_lookup 
ON quotation_item_cost_components (quotation_id, item_id, cost_code);

