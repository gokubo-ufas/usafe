-- Convert any 'manual' events dispatched during dev to 'earthquake'
-- (manual production dispatch = earthquake with earthquake_info_id IS NULL)
UPDATE events SET event_type = 'earthquake' WHERE event_type = 'manual';

-- Restore constraint to the final two-type spec: earthquake | test
ALTER TABLE events
  DROP CONSTRAINT events_event_type_check,
  ADD CONSTRAINT events_event_type_check
    CHECK (event_type IN ('earthquake', 'test'));

-- Re-create dispatch_alert enforcing the final spec.
-- Manual production alerts  → p_event_type='earthquake', p_eq_info_id=NULL
-- Future auto-earthquake     → p_event_type='earthquake', p_eq_info_id=<P2P id>
-- Training drills            → p_event_type='test'
CREATE OR REPLACE FUNCTION dispatch_alert(
  p_event_type    text,
  p_issuer        text,
  p_comment       text     DEFAULT NULL,
  p_eq_info_id    text     DEFAULT NULL,
  p_max_intensity integer  DEFAULT NULL,
  p_epicenter     text     DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  IF p_event_type NOT IN ('earthquake', 'test') THEN
    RAISE EXCEPTION 'Invalid event_type: %. Allowed values: earthquake, test', p_event_type;
  END IF;

  INSERT INTO events (event_type, issuer, comment, earthquake_info_id, max_intensity, epicenter)
  VALUES (p_event_type, p_issuer, p_comment, p_eq_info_id, p_max_intensity, p_epicenter)
  RETURNING event_id INTO v_event_id;

  INSERT INTO responses (event_id, employee_number)
  SELECT v_event_id, employee_number
  FROM   employees
  WHERE  is_active = true;

  RETURN v_event_id;
END;
$$;
