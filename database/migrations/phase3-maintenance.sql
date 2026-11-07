-- Apply once to an existing R1 database before using /master/manage.
BEGIN;
CREATE TABLE IF NOT EXISTS master_data_audit (
  audit_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type varchar(30) NOT NULL,
  entity_id varchar(50) NOT NULL,
  action varchar(30) NOT NULL,
  actor_id varchar(50) NOT NULL,
  actor_name varchar(255) NOT NULL,
  before_data jsonb,
  after_data jsonb,
  comment text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS master_data_audit_entity_idx ON master_data_audit(entity_type, entity_id, created_at DESC);
ALTER TABLE road_rates ALTER COLUMN status SET DEFAULT 'DRAFT';
COMMIT;
