-- Schema: DESIGN.md §7. Docker runs files in db/ in name order on first start.

CREATE TABLE components (
  id           SERIAL PRIMARY KEY,
  form         TEXT NOT NULL UNIQUE,
  variant_of   TEXT,
  is_radical   BOOLEAN NOT NULL DEFAULT false,
  name_vi      TEXT,
  han_viet     TEXT,
  meaning_vi   TEXT,
  stroke_count INTEGER,
  position     TEXT CHECK (position IN ('left', 'right', 'top', 'bottom', 'enclose')),
  origin_vi    TEXT,
  usage_vi     TEXT,
  mnemonic_vi  TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE characters (
  id            SERIAL PRIMARY KEY,
  hanzi         TEXT NOT NULL UNIQUE,
  traditional   TEXT,
  radical       TEXT,
  chiet_tu      TEXT,
  chiet_tu_type TEXT CHECK (chiet_tu_type IN ('mnemonic', 'etymology')),
  stroke_count  INTEGER,
  hsk2_level    INTEGER CHECK (hsk2_level BETWEEN 1 AND 6),
  hsk3_level    INTEGER CHECK (hsk3_level BETWEEN 1 AND 7),
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed')),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE character_readings (
  id         SERIAL PRIMARY KEY,
  char_id    INTEGER NOT NULL REFERENCES characters(id),
  pinyin     TEXT NOT NULL,
  han_viet   TEXT,
  meaning_vi TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (char_id, pinyin)
);

CREATE TABLE character_parts (
  char_id  INTEGER NOT NULL REFERENCES characters(id),
  position INTEGER NOT NULL,
  part     TEXT NOT NULL,
  PRIMARY KEY (char_id, position)
);

CREATE TABLE words (
  id          SERIAL PRIMARY KEY,
  word        TEXT NOT NULL UNIQUE,
  traditional TEXT,
  pinyin      TEXT NOT NULL,
  han_viet    TEXT,
  meaning_vi  TEXT NOT NULL,
  hsk2_level  INTEGER CHECK (hsk2_level BETWEEN 1 AND 6),
  hsk3_level  INTEGER CHECK (hsk3_level BETWEEN 1 AND 7),
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

-- Every edit (including a soft delete) bumps updated_at, which is what sync relies on.
CREATE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER touch BEFORE UPDATE ON components FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch BEFORE UPDATE ON character_readings FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch BEFORE UPDATE ON words FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Supabase exposes every public table through its REST API. RLS with no policies blocks that;
-- the backend connects as the table owner, which bypasses RLS.
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
