import type { Bundle, BundleCharacter, Character, Component, Word } from './core'
import { db } from './db'

// Rows are shaped into the camelCase core types in SQL, so the API returns them as-is.

const READINGS_JSON = `
  (SELECT coalesce(json_agg(json_build_object(
     'pinyin', r.pinyin, 'hanViet', r.han_viet, 'meaningVi', r.meaning_vi, 'isPrimary', r.is_primary
   ) ORDER BY r.is_primary DESC, r.id), '[]')
   FROM character_readings r WHERE r.char_id = c.id AND r.deleted_at IS NULL)`

const CHARACTER_JSON = `json_build_object(
  'id', c.id, 'hanzi', c.hanzi, 'traditional', c.traditional, 'radical', c.radical,
  'chietTu', c.chiet_tu, 'chietTuType', c.chiet_tu_type, 'strokeCount', c.stroke_count,
  'hsk2Level', c.hsk2_level, 'hsk3Level', c.hsk3_level,
  'readings', ${READINGS_JSON},
  'parts', (SELECT coalesce(json_agg(json_build_object('part', p.part, 'position', p.position) ORDER BY p.position), '[]')
            FROM character_parts p WHERE p.char_id = c.id))`

const BUNDLE_CHARACTER_JSON = `json_build_object(
  'hanzi', c.hanzi, 'traditional', c.traditional, 'hsk2Level', c.hsk2_level, 'hsk3Level', c.hsk3_level,
  'readings', ${READINGS_JSON})`

const WORD_JSON = `json_build_object(
  'id', w.id, 'word', w.word, 'traditional', w.traditional, 'pinyin', w.pinyin, 'hanViet', w.han_viet,
  'meaningVi', w.meaning_vi, 'hsk2Level', w.hsk2_level, 'hsk3Level', w.hsk3_level)`

const COMPONENT_JSON = `json_build_object(
  'id', k.id, 'form', k.form, 'variantOf', k.variant_of, 'isRadical', k.is_radical, 'nameVi', k.name_vi,
  'hanViet', k.han_viet, 'meaningVi', k.meaning_vi, 'strokeCount', k.stroke_count)`

const VISIBLE = `status = 'reviewed' AND deleted_at IS NULL`

// Versions are epoch microseconds as a string: exact, and safe in a query string.
const EPOCH_US = (col: string) => `(extract(epoch FROM ${col}) * 1000000)::bigint`

export async function getVersion(): Promise<string> {
  const { rows } = await db().query(`
    SELECT ${EPOCH_US('greatest(max(t.updated_at), to_timestamp(0))')}::text AS version FROM (
      SELECT updated_at FROM characters
      UNION ALL SELECT updated_at FROM character_readings
      UNION ALL SELECT updated_at FROM words
    ) t`)
  return rows[0].version
}

export async function getCharacters(hanzi: readonly string[]): Promise<Character[]> {
  const { rows } = await db().query(
    `SELECT ${CHARACTER_JSON} AS data FROM characters c WHERE c.hanzi = ANY($1) AND c.${VISIBLE}`,
    [hanzi],
  )
  return rows.map((r) => r.data)
}

export async function getComponents(forms: readonly string[]): Promise<Component[]> {
  const { rows } = await db().query(
    `SELECT ${COMPONENT_JSON} AS data FROM components k WHERE k.form = ANY($1) AND k.deleted_at IS NULL`,
    [forms],
  )
  return rows.map((r) => r.data)
}

export async function getWord(word: string): Promise<Word | null> {
  const { rows } = await db().query(`SELECT ${WORD_JSON} AS data FROM words w WHERE w.word = $1 AND w.${VISIBLE}`, [word])
  return rows[0]?.data ?? null
}

// The basic bundle is HSK1–2 in either standard (DESIGN.md §6).
// coalesce: NULL levels must give false, not NULL, or `NOT (...)` drops the row from `removed`.
const IN_BUNDLE = (t: string) =>
  `coalesce(${t}.status = 'reviewed' AND ${t}.deleted_at IS NULL AND (${t}.hsk2_level <= 2 OR ${t}.hsk3_level <= 2), false)`

// since = null returns the full bundle. Otherwise only rows changed after `since`, plus the
// keys of rows that left the bundle (deleted, unreviewed, or moved to a higher level).
export async function getBundle(since: string | null): Promise<Bundle> {
  const after = since ?? '-1'
  const charChanged = `(${EPOCH_US('c.updated_at')} > $1 OR EXISTS (
    SELECT 1 FROM character_readings r WHERE r.char_id = c.id AND ${EPOCH_US('r.updated_at')} > $1))`

  const [version, chars, words, removedChars, removedWords] = await Promise.all([
    getVersion(),
    db().query(`SELECT ${BUNDLE_CHARACTER_JSON} AS data FROM characters c WHERE ${IN_BUNDLE('c')} AND ${charChanged}`, [after]),
    db().query(`SELECT ${WORD_JSON} AS data FROM words w WHERE ${IN_BUNDLE('w')} AND ${EPOCH_US('w.updated_at')} > $1`, [after]),
    since === null ? null : db().query(`SELECT c.hanzi FROM characters c WHERE NOT (${IN_BUNDLE('c')}) AND ${charChanged}`, [after]),
    since === null ? null : db().query(`SELECT w.word FROM words w WHERE NOT (${IN_BUNDLE('w')}) AND ${EPOCH_US('w.updated_at')} > $1`, [after]),
  ])

  return {
    version,
    characters: chars.rows.map((r): BundleCharacter => r.data),
    words: words.rows.map((r): Word => r.data),
    removed: {
      characters: removedChars?.rows.map((r) => r.hanzi) ?? [],
      words: removedWords?.rows.map((r) => r.word) ?? [],
    },
  }
}
