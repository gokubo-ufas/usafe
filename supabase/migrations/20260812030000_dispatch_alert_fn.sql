-- Allow 'manual' as a third event type for human-dispatched production alerts
ALTER TABLE events
  DROP CONSTRAINT events_event_type_check,
  ADD CONSTRAINT events_event_type_check
    CHECK (event_type IN ('earthquake', 'test', 'manual'));

-- dispatch_alert: atomically create an event and blank response rows for all
-- active employees in a single transaction.  Any failure rolls back both inserts.
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
