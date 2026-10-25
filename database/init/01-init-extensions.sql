-- ====================================================================
-- THILOGI Web Logistics Operating Platform
-- File: 01-init-extensions.sql
-- Description: Cài đặt các extension nền tảng bắt buộc của PostgreSQL
-- ====================================================================

-- 1. btree_gist: Bắt buộc để hỗ trợ exclusion constraint (EXCLUDE USING gist) 
--    kết hợp giữa các trường khóa (vendor_id, origin, destination...) và dải ngày (validity_range)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. uuid-ossp: Sinh định danh duy nhất ngẫu nhiên (UUIDv4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. citext: Hỗ trợ trường text không phân biệt hoa thường (Case-insensitive)
CREATE EXTENSION IF NOT EXISTS citext;

-- Xác nhận cài đặt
DO $$
BEGIN
    RAISE NOTICE '>>> THILOGI: Extensions [btree_gist, uuid-ossp, citext] đã được cài đặt thành công!';
END $$;
