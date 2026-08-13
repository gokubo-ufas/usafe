-- dispatch_alert に p_employee_numbers を追加。
-- 指定した場合はその社員のみ、NULLの場合は全在籍中社員を対象にする。

CREATE OR REPLACE FUNCTION dispatch_alert(
  p_event_type       text,
  p_issuer           text,
  p_comment          text     DEFAULT NULL,
  p_eq_info_id       text     DEFAULT NULL,
  p_max_intensity    integer  DEFAULT NULL,
  p_epicenter        text     DEFAULT NULL,
  p_employee_numbers text[]   DEFAULT NULL
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
  WHERE  is_active = true
    AND (p_employee_numbers IS NULL OR employee_number = ANY(p_employee_numbers));

  RETURN v_event_id;
END;
$$;
