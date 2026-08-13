-- Snapshot employee name and department into responses at dispatch time.
-- This preserves historical accuracy even if employee info changes later.

ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS name       text,
  ADD COLUMN IF NOT EXISTS department text;

-- 既存レコードに現在の社員情報をバックフィル
UPDATE responses r
SET name       = e.name,
    department = e.department
FROM employees e
WHERE r.employee_number = e.employee_number
  AND (r.name IS NULL OR r.department IS NULL);

-- Re-create dispatch_alert to include the snapshot columns.
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

  INSERT INTO responses (event_id, employee_number, name, department)
  SELECT v_event_id, employee_number, name, department
  FROM   employees
  WHERE  is_active = true;

  RETURN v_event_id;
END;
$$;
