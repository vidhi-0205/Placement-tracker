-- Additive migration: preserves all existing rows and foreign keys.
-- Run once against the placement_tracker database. The app also works before
-- this migration and displays "Not announced"/"Not available" for these fields.
ALTER TABLE Drive
  ADD COLUMN oa_date DATE NULL,
  ADD COLUMN oa_time TIME NULL,
  ADD COLUMN interview_date DATE NULL;

ALTER TABLE Job
  ADD COLUMN number_of_openings INT NULL,
  ADD COLUMN backlog_criteria VARCHAR(255) NULL,
  ADD COLUMN oa_instructions TEXT NULL;
