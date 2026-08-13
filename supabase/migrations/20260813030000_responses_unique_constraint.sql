-- (event_id, employee_number) の組み合わせを一意にしてupsertを可能にする
ALTER TABLE responses
  ADD CONSTRAINT responses_event_employee_unique UNIQUE (event_id, employee_number);
