BEGIN;
ALTER TABLE customer_quotations ADD COLUMN IF NOT EXISTS created_by_user_id varchar(50);
ALTER TABLE customer_quotations ADD COLUMN IF NOT EXISTS commercial_snapshot jsonb;

CREATE OR REPLACE FUNCTION quotation_commercial_snapshot(qid uuid) RETURNS jsonb LANGUAGE sql STABLE AS $$
 SELECT jsonb_build_object(
   'quotationNo',q.quotation_no,'version',q.version,
   'customerName',COALESCE(q.customer_name_snapshot,p.partner_name,q.customer_id),
   'taxCode',COALESCE(q.customer_tax_code_snapshot,p.tax_code,''),
   'address',COALESCE(q.customer_address_snapshot,p.address,''),
   'commodity',COALESCE(cm.name,''),'paymentTermsDays',q.payment_terms_days,
   'totalSellAmount',q.total_sell_amount,'currency',q.currency,
   'items',COALESCE((SELECT jsonb_agg(jsonb_build_object(
     'service',i.service_package,'inclusion',i.pricing_inclusion,
     'origin',COALESCE(a.name,i.origin_location_id),'destination',COALESCE(b.name,i.destination_location_id),
     'equipment',i.equipment_type,'quantity',i.planned_quantity,'unit',i.unit,
     'unitPrice',i.unit_sell_price,'amount',i.total_sell_price) ORDER BY i.created_at,i.item_id)
     FROM quotation_service_items i LEFT JOIN locations a ON a.location_id=i.origin_location_id LEFT JOIN locations b ON b.location_id=i.destination_location_id WHERE i.quotation_id=q.quotation_id),'[]'::jsonb))
 FROM customer_quotations q LEFT JOIN partners p ON p.partner_id=q.customer_id LEFT JOIN commodities cm ON cm.commodity_id=q.commodity_id WHERE q.quotation_id=qid;
$$;

-- Legacy approved quotations freeze currently available labels, not reconstructed historical labels.
UPDATE customer_quotations SET commercial_snapshot=quotation_commercial_snapshot(quotation_id)
WHERE status IN ('APPROVED','SUPERSEDED') AND commercial_snapshot IS NULL;

CREATE OR REPLACE FUNCTION guard_locked_quotation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.immutable_locked OR OLD.status IN ('APPROVED','SUPERSEDED') THEN
   IF TG_OP='UPDATE' AND OLD.status='APPROVED' AND NEW.status='SUPERSEDED'
      AND (to_jsonb(NEW)-'status'-'updated_at')=(to_jsonb(OLD)-'status'-'updated_at') THEN RETURN NEW; END IF;
   RAISE EXCEPTION 'Approved quotation is immutable; create a new version';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_locked_quotation ON customer_quotations;
CREATE TRIGGER guard_locked_quotation BEFORE UPDATE OR DELETE ON customer_quotations FOR EACH ROW EXECUTE FUNCTION guard_locked_quotation();

CREATE OR REPLACE FUNCTION guard_locked_quotation_child() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE qid uuid; locked boolean;
BEGIN
 -- Lock both parents when reassigning a child; never move data out of a locked quote.
 FOR qid IN SELECT DISTINCT x FROM unnest(ARRAY[
   CASE WHEN TG_OP<>'INSERT' THEN OLD.quotation_id ELSE NULL END,
   CASE WHEN TG_OP<>'DELETE' THEN NEW.quotation_id ELSE NULL END]) x WHERE x IS NOT NULL ORDER BY x
 LOOP
   SELECT immutable_locked OR status IN ('APPROVED','SUPERSEDED') INTO locked FROM customer_quotations WHERE quotation_id=qid FOR UPDATE;
   IF locked THEN RAISE EXCEPTION 'Approved quotation lines and snapshots are immutable'; END IF;
 END LOOP;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_locked_items ON quotation_service_items;
CREATE TRIGGER guard_locked_items BEFORE INSERT OR UPDATE OR DELETE ON quotation_service_items FOR EACH ROW EXECUTE FUNCTION guard_locked_quotation_child();
DROP TRIGGER IF EXISTS guard_locked_snapshots ON quotation_buy_snapshots;
CREATE TRIGGER guard_locked_snapshots BEFORE INSERT OR UPDATE OR DELETE ON quotation_buy_snapshots FOR EACH ROW EXECUTE FUNCTION guard_locked_quotation_child();
COMMIT;
