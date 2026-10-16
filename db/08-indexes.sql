-- Indexes for the access patterns the API actually has (BE/src/queries.ts).
-- Safe to rerun.

-- /bundle?since= filters on updated_at across each synced table.
CREATE INDEX IF NOT EXISTS characters_updated_at_idx         ON characters (updated_at);
CREATE INDEX IF NOT EXISTS character_readings_updated_at_idx ON character_readings (updated_at);
CREATE INDEX IF NOT EXISTS words_updated_at_idx              ON words (updated_at);
CREATE INDEX IF NOT EXISTS components_updated_at_idx         ON components (updated_at);

-- /bundle also selects the basic package by level, and only reviewed rows ship.
CREATE INDEX IF NOT EXISTS characters_hsk2_idx ON characters (hsk2_level) WHERE deleted_at IS NULL AND status = 'reviewed';
CREATE INDEX IF NOT EXISTS characters_hsk3_idx ON characters (hsk3_level) WHERE deleted_at IS NULL AND status = 'reviewed';
CREATE INDEX IF NOT EXISTS words_hsk2_idx      ON words (hsk2_level)      WHERE deleted_at IS NULL AND status = 'reviewed';
CREATE INDEX IF NOT EXISTS words_hsk3_idx      ON words (hsk3_level)      WHERE deleted_at IS NULL AND status = 'reviewed';

-- /characters/:hanzi joins readings and parts by char_id.
CREATE INDEX IF NOT EXISTS character_readings_char_id_idx ON character_readings (char_id);
-- character_parts' primary key already starts with char_id, so that lookup is covered.
-- Resolving a part back to its component or character uses the existing unique indexes
-- on components.form and characters.hanzi.
