-- ============================================================
-- Enable Row Level Security and add basic access policies
-- ============================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Helper: returns true when the current authenticated user
-- is a registered active employee.
CREATE OR REPLACE FUNCTION is_registered_employee()
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees
    WHERE lower(email) = lower(auth.email())
      AND is_active = true
  );
$$;

-- --------------------------------------------------------
-- employees
-- --------------------------------------------------------
CREATE POLICY "employees_select_own"
  ON employees FOR SELECT
  TO authenticated
  USING (lower(email) = lower(auth.email()) AND is_active = true);

-- --------------------------------------------------------
-- events
-- --------------------------------------------------------
CREATE POLICY "events_select_registered"
  ON events FOR SELECT
  TO authenticated
  USING (is_registered_employee());

-- --------------------------------------------------------
-- responses
-- --------------------------------------------------------
CREATE POLICY "responses_select_registered"
  ON responses FOR SELECT
  TO authenticated
  USING (is_registered_employee());

CREATE POLICY "responses_insert_own"
  ON responses FOR INSERT
  TO authenticated
  WITH CHECK (
    is_registered_employee()
    AND employee_number = (
      SELECT employee_number FROM employees
      WHERE lower(email) = lower(auth.email())
        AND is_active = true
      LIMIT 1
    )
  );
