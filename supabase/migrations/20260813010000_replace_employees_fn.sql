-- sync_employees_from_gas を全件削除→全件登録方式に変更。
-- responses.employee_number に FK がないため DELETE は安全。

CREATE OR REPLACE FUNCTION sync_employees_from_gas(p_employees jsonb)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_received int;
  v_active   int;
  v_inactive int;
BEGIN
  v_received := jsonb_array_length(p_employees);

  -- 全件削除
  DELETE FROM employees;

  -- 全件登録
  INSERT INTO employees (employee_number, name, email, department, is_active, updated_at)
  SELECT
    e->>'employee_number',
    e->>'name',
    lower(trim(e->>'email')),
    NULLIF(trim(e->>'department'), ''),
    (e->>'is_active')::boolean,
    now()
  FROM jsonb_array_elements(p_employees) AS e;

  SELECT count(*) INTO v_active   FROM employees WHERE is_active = true;
  SELECT count(*) INTO v_inactive FROM employees WHERE is_active = false;

  RETURN jsonb_build_object(
    'success',  true,
    'received', v_received,
    'active',   v_active,
    'inactive', v_inactive
  );
END;
$$;
