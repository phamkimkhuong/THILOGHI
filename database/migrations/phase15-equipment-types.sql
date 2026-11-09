-- ====================================================================
-- THILOGI Master Data: Phase 15 - Quản lý Danh mục Thiết bị & Container
-- Bảng: equipment_types
-- ====================================================================

CREATE TABLE IF NOT EXISTS equipment_types (
    equipment_type_id VARCHAR(30) PRIMARY KEY,
    equipment_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_reefer BOOLEAN NOT NULL DEFAULT FALSE,
    aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO equipment_types (equipment_type_id, equipment_name, category, is_reefer, aliases, is_active, sort_order)
VALUES
  ('40HR', 'Container 40'' Lạnh Cao (40HR / 40RH)', 'REEFER_CONT', TRUE, '["40HR", "40RH", "40RF"]'::jsonb, TRUE, 1),
  ('20HR', 'Container 20'' Lạnh (20HR / 20RF)', 'REEFER_CONT', TRUE, '["20HR", "20RF"]'::jsonb, TRUE, 2),
  ('40HC', 'Container 40'' Cao Tiêu chuẩn (40HC)', 'DRY_CONT', FALSE, '["40HC", "40HQ"]'::jsonb, TRUE, 3),
  ('20GP', 'Container 20'' Tiêu chuẩn (20GP / 20DC)', 'DRY_CONT', FALSE, '["20GP", "20DC"]'::jsonb, TRUE, 4),
  ('TRUCK_15T', 'Xe tải thùng 15 Tấn', 'TRUCK', FALSE, '["TRUCK_15T"]'::jsonb, TRUE, 5),
  ('TRUCK_FO', 'Xe bồn chuyên dụng chất lỏng', 'TRUCK', FALSE, '["TRUCK_FO"]'::jsonb, TRUE, 6),
  ('RMS', 'Rơ moóc sàn (RMS)', 'TRAILER', FALSE, '["RMS"]'::jsonb, TRUE, 7),
  ('General', 'Phương tiện đa dụng (General)', 'GENERAL', FALSE, '["General"]'::jsonb, TRUE, 8)
ON CONFLICT (equipment_type_id) DO UPDATE SET
  equipment_name = EXCLUDED.equipment_name,
  category = EXCLUDED.category,
  is_reefer = EXCLUDED.is_reefer,
  aliases = EXCLUDED.aliases,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

