-- Additive migration for login/signup. Existing users remain intact.
-- Existing rows must set a password through an administrative/reset flow before
-- those accounts can log in; password hashes are never stored in plain text.
ALTER TABLE User
  ADD COLUMN password_hash VARCHAR(255) NULL;
