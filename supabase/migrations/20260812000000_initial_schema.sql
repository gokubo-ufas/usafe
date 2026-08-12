-- ============================================================
-- U-Safe initial schema
-- ============================================================

-- --------------------------------------------------------
-- employees
-- --------------------------------------------------------
CREATE TABLE employees (
  employee_number text        PRIMARY KEY,
  name            text        NOT NULL,
  email           text        NOT NULL,
  department      text,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive email uniqueness
CREATE UNIQUE INDEX employees_email_lower_unique ON employees (lower(email));

-- --------------------------------------------------------
-- events
-- --------------------------------------------------------
CREATE TABLE events (
  event_id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type         text        NOT NULL,
  issued_at          timestamptz NOT NULL DEFAULT now(),
  earthquake_info_id text,
  max_intensity      integer,
  epicenter          text,
  issuer             text        NOT NULL,
  comment            text,
  created_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT events_event_type_check CHECK (event_type IN ('earthquake', 'test'))
);

CREATE INDEX events_issued_at_idx ON events (issued_at);

-- --------------------------------------------------------
-- responses
-- --------------------------------------------------------
CREATE TABLE responses (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id        uuid        NOT NULL REFERENCES events (event_id),
  employee_number text        NOT NULL,
  self_status     text,
  family_status   text,
  work_status     text,
  comment         varchar(50),
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT responses_self_status_check
    CHECK (self_status IS NULL OR self_status IN ('safe', 'injured', 'need_rescue')),

  CONSTRAINT responses_family_status_check
    CHECK (family_status IS NULL OR family_status IN ('safe', 'injured', 'need_rescue', 'checking', 'not_applicable')),

  CONSTRAINT responses_work_status_check
    CHECK (work_status IS NULL OR work_status IN ('available', 'unavailable'))
);

-- Composite index for fetching latest response per employee per event
CREATE INDEX responses_event_employee_created_idx
  ON responses (event_id, employee_number, created_at);
