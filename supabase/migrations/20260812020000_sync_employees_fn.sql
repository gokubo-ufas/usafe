-- ============================================================
-- Atomic employee sync function (called via POST /api/employees/sync)
--
-- Design principle (disaster resilience):
--   Alert dispatch (earthquake / manual / test) NEVER calls Google Sheets or GAS.
--   It operates solely on the employees table synced by this function.
--   A GAS or Google Sheets outage must never block alert dispatch.
--
-- Atomicity:
--   All operations (upsert + deactivation) run in a single PL/pgSQL function,
--   which Supabase/PostgreSQL wraps in a single transaction.
--   Any failure rolls back the entire sync — no partial updates.
--
-- Last-sync-time tracking (no extra table needed):
--   Every row touched by this function receives updated_at = now()
--   (transaction start time, constant within a transaction).
--   Therefore: SELECT MAX(updated_at) FROM employees = last successful sync time.
--   Returns NULL when the table is empty (no sync has occurred yet).
-- ============================================================

CREATE OR REPLACE FUNCTION sync_employees_from_gas(p_employees jsonb)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_received    int;
  v_active      int;
  v_inactive    int;
  v_emp_numbers text[];
BEGIN
  v_received := jsonb_array_length(p_employees);

  -- Collect all employee_numbers in the batch
  SELECT COALESCE(array_agg(e->>'employee_number'), ARRAY[]::text[])
  INTO v_emp_numbers
  FROM jsonb_array_elements(p_employees) AS e;

  -- Upsert every employee in the batch (single INSERT ... ON CONFLICT statement)
  INSERT INTO employees (employee_number, name, email, department, is_active, updated_at)
  SELECT
    e->>'employee_number',
    e->>'name',
    lower(trim(e->>'email')),
    NULLIF(trim(e->>'department'), ''),
    (e->>'is_active')::boolean,
    now()
  FROM jsonb_array_elements(p_employees) AS e
  ON CONFLICT (employee_number) DO UPDATE
    SET name       = EXCLUDED.name,
        email      = EXCLUDED.email,
        department = EXCLUDED.department,
        is_active  = EXCLUDED.is_active,
        updated_at = now();

  -- Deactivate employees present in DB but absent from this batch
  UPDATE employees
  SET is_active  = false,
      updated_at = now()
  WHERE is_active = true
    AND employee_number != ALL(v_emp_numbers);

  -- Compute response counts (scoped to employees in this batch)
  SELECT count(*) INTO v_active
  FROM employees
  WHERE employee_number = ANY(v_emp_numbers) AND is_active = true;

  SELECT count(*) INTO v_inactive
  FROM employees
  WHERE employee_number = ANY(v_emp_numbers) AND is_active = false;

  RETURN jsonb_build_object(
    'success',  true,
    'received', v_received,
    'active',   v_active,
    'inactive', v_inactive
  );
END;
$$;
