-- Splits the learner-facing explanation into origin (chiet_tu, now always the real history) and
-- a longer memory aid (mnemonic_vi), and gives components a pinyin so every part in the
-- structure shows one. Safe to rerun.

ALTER TABLE characters ADD COLUMN IF NOT EXISTS mnemonic_vi TEXT;
ALTER TABLE components ADD COLUMN IF NOT EXISTS pinyin TEXT;
