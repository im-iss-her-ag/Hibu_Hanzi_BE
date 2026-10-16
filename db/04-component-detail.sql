-- Adds the radical description columns to an existing components table.
-- Safe to rerun. New databases get these from 01-schema.sql instead.

ALTER TABLE components
  ADD COLUMN IF NOT EXISTS position     TEXT,
  ADD COLUMN IF NOT EXISTS origin_vi    TEXT,
  ADD COLUMN IF NOT EXISTS usage_vi     TEXT,
  ADD COLUMN IF NOT EXISTS mnemonic_vi  TEXT;

-- NULL position = the component appears in more than one place.
ALTER TABLE components DROP CONSTRAINT IF EXISTS components_position_check;
ALTER TABLE components ADD CONSTRAINT components_position_check
  CHECK (position IN ('left', 'right', 'top', 'bottom', 'enclose'));
