import { Hono } from 'hono'
import { timingSafeEqual } from 'node:crypto'
import { readingInWord, type Character } from './core'
import { db, transaction } from './db'

// Review and edit API for the /admin page in FE. Unlike the public API it sees draft rows
// and can write, so every route needs ADMIN_TOKEN. Without it the routes are off.
// The token comes from the Worker's secrets (c.env) or, under Node, from process.env.
export type AdminBindings = { ADMIN_TOKEN?: string }

export const admin = new Hono<{ Bindings: AdminBindings }>()

const sameToken = (given: string, token: string) => {
  const a = Buffer.from(given)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

admin.use('*', async (c, next) => {
  const token = c.env?.ADMIN_TOKEN ?? process.env.ADMIN_TOKEN
  if (!token) return c.json({ error: 'admin_disabled' }, 503)
  const given = c.req.header('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!sameToken(given, token)) return c.json({ error: 'unauthorized' }, 401)
  await next()
})

type Std = 'hsk2' | 'hsk3'
type Kind = 'characters' | 'words'

class BadRequest extends Error {}

const levelColumn = (std: string | undefined) => ((std === 'hsk2' ? 'hsk2' : 'hsk3') as Std) + '_level'

// Filters shared by both lists: standard + level, status, and a free-text search.
function listFilter(c: { req: { query: (k: string) => string | undefined } }, alias: string, search: string) {
  const col = `${alias}.${levelColumn(c.req.query('std'))}`
  const level = Number(c.req.query('level') ?? 1)
  const status = c.req.query('status') ?? 'draft'
  const q = c.req.query('q')?.trim() ?? ''
  const params: unknown[] = []
  const where = [`${alias}.deleted_at IS NULL`]
  if (level > 0) {
    params.push(level)
    where.push(`${col} = $${params.length}`)
  }
  if (status === 'draft' || status === 'reviewed') {
    params.push(status)
    where.push(`${alias}.status = $${params.length}`)
  }
  if (q) {
    params.push(q, `%${q}%`)
    where.push(search.replaceAll('$Q', `$${params.length - 1}`).replaceAll('$LIKE', `$${params.length}`))
  }
  const limit = Math.min(Number(c.req.query('limit') ?? 30), 100)
  const offset = Math.max(Number(c.req.query('offset') ?? 0), 0)
  params.push(limit, offset)
  return { col, where: where.join(' AND '), params, page: `LIMIT $${params.length - 1} OFFSET $${params.length}` }
}

// ---------- characters ----------

const ADMIN_CHARACTER_JSON = `json_build_object(
  'id', c.id, 'hanzi', c.hanzi, 'traditional', c.traditional, 'radical', c.radical,
  'chietTu', c.chiet_tu, 'chietTuType', c.chiet_tu_type, 'strokeCount', c.stroke_count,
  'hsk2Level', c.hsk2_level, 'hsk3Level', c.hsk3_level, 'status', c.status, 'updatedAt', c.updated_at,
  'radicalInfo', (SELECT json_build_object('nameVi', k.name_vi, 'hanViet', k.han_viet, 'meaningVi', k.meaning_vi)
                  FROM components k WHERE k.form = c.radical AND k.deleted_at IS NULL),
  'readings', (SELECT coalesce(json_agg(json_build_object(
                 'pinyin', r.pinyin, 'hanViet', r.han_viet, 'meaningVi', r.meaning_vi, 'isPrimary', r.is_primary
               ) ORDER BY r.is_primary DESC, r.id), '[]')
               FROM character_readings r WHERE r.char_id = c.id AND r.deleted_at IS NULL),
  'parts', (SELECT coalesce(json_agg(json_build_object(
              'part', p.part,
              'hanViet', coalesce(k.han_viet, pr.han_viet),
              'meaningVi', coalesce(k.meaning_vi, pr.meaning_vi),
              'resolved', k.id IS NOT NULL OR pc.id IS NOT NULL
            ) ORDER BY p.position), '[]')
            FROM character_parts p
            LEFT JOIN components k ON k.form = p.part AND k.deleted_at IS NULL
            LEFT JOIN characters pc ON pc.hanzi = p.part AND pc.deleted_at IS NULL
            LEFT JOIN character_readings pr ON pr.char_id = pc.id AND pr.is_primary AND pr.deleted_at IS NULL
            WHERE p.char_id = c.id))`

// What a character needs before it may ship: a radical and a primary reading with Han-Viet
// and meaning. Mirrors data-tools/check-data.mts.
const CHARACTER_READY = `c.radical IS NOT NULL AND EXISTS (
  SELECT 1 FROM character_readings r WHERE r.char_id = c.id AND r.deleted_at IS NULL
    AND r.is_primary AND r.han_viet IS NOT NULL AND r.meaning_vi IS NOT NULL)`

async function getAdminCharacter(id: number) {
  const { rows } = await db().query(`SELECT ${ADMIN_CHARACTER_JSON} AS data FROM characters c WHERE c.id = $1`, [id])
  return rows[0]?.data ?? null
}

admin.get('/characters', async (c) => {
  const f = listFilter(
    c,
    'c',
    `(c.hanzi = $Q OR EXISTS (SELECT 1 FROM character_readings r WHERE r.char_id = c.id AND r.deleted_at IS NULL
       AND (r.pinyin ILIKE $LIKE OR r.han_viet ILIKE $LIKE OR r.meaning_vi ILIKE $LIKE)))`,
  )
  const { rows } = await db().query(
    `SELECT ${ADMIN_CHARACTER_JSON} AS data, count(*) OVER () AS total
     FROM characters c WHERE ${f.where} ORDER BY ${f.col}, c.id ${f.page}`,
    f.params,
  )
  return c.json({ total: Number(rows[0]?.total ?? 0), items: rows.map((r) => r.data) })
})

type ReadingInput = { pinyin: string; hanViet: string | null; meaningVi: string | null; isPrimary: boolean }
type CharacterInput = {
  traditional: string | null
  radical: string | null
  strokeCount: number | null
  chietTu: string | null
  chietTuType: 'mnemonic' | 'etymology' | null
  readings: ReadingInput[]
  parts: string[]
}

const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)

function parseCharacter(body: any): CharacterInput {
  const readings: ReadingInput[] = (Array.isArray(body?.readings) ? body.readings : []).map((r: any) => ({
    pinyin: text(r?.pinyin)?.toLowerCase() ?? '',
    hanViet: text(r?.hanViet),
    meaningVi: text(r?.meaningVi),
    isPrimary: r?.isPrimary === true,
  }))
  if (!readings.length) throw new BadRequest('Cần ít nhất một âm đọc')
  if (readings.some((r) => !r.pinyin)) throw new BadRequest('Âm đọc nào cũng phải có pinyin')
  if (new Set(readings.map((r) => r.pinyin)).size !== readings.length) throw new BadRequest('Có hai âm đọc trùng pinyin')
  if (readings.filter((r) => r.isPrimary).length !== 1) throw new BadRequest('Phải có đúng một âm chính')
  const chietTuType = body?.chietTuType === 'mnemonic' || body?.chietTuType === 'etymology' ? body.chietTuType : null
  const strokeCount = Number.isInteger(body?.strokeCount) && body.strokeCount > 0 ? body.strokeCount : null
  const parts = (Array.isArray(body?.parts) ? body.parts : []).map(text).filter(Boolean) as string[]
  return {
    traditional: text(body?.traditional),
    radical: text(body?.radical),
    strokeCount,
    chietTu: text(body?.chietTu),
    chietTuType: text(body?.chietTu) ? chietTuType ?? 'mnemonic' : null,
    readings,
    parts,
  }
}

// A radical or part must be a component or a character (DESIGN.md §7).
async function unresolvable(forms: string[]) {
  if (!forms.length) return []
  const { rows } = await db().query(
    `SELECT f FROM unnest($1::text[]) AS f
     WHERE NOT EXISTS (SELECT 1 FROM components k WHERE k.form = f AND k.deleted_at IS NULL)
       AND NOT EXISTS (SELECT 1 FROM characters x WHERE x.hanzi = f AND x.deleted_at IS NULL)`,
    [forms],
  )
  return rows.map((r) => r.f as string)
}

admin.put('/characters/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const input = parseCharacter(await c.req.json().catch(() => null))
  const missing = await unresolvable([...(input.radical ? [input.radical] : []), ...input.parts])
  if (missing.length) throw new BadRequest(`Không tra được: ${missing.join(' ')} (chưa có trong bộ thủ/thành phần hay bảng chữ)`)

  const found = await transaction(async (q) => {
    const res = await q.query(
      `UPDATE characters SET traditional = $2, radical = $3, stroke_count = $4, chiet_tu = $5, chiet_tu_type = $6
       WHERE id = $1 AND deleted_at IS NULL`,
      [id, input.traditional, input.radical, input.strokeCount, input.chietTu, input.chietTuType],
    )
    if (!res.rowCount) return false
    // Readings left out are soft-deleted so clients drop them on their next sync.
    await q.query(
      `UPDATE character_readings SET is_primary = false, deleted_at = now()
       WHERE char_id = $1 AND deleted_at IS NULL AND NOT (pinyin = ANY($2))`,
      [id, input.readings.map((r) => r.pinyin)],
    )
    for (const r of input.readings) {
      await q.query(
        `INSERT INTO character_readings (char_id, pinyin, han_viet, meaning_vi, is_primary) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (char_id, pinyin) DO UPDATE SET
           han_viet = EXCLUDED.han_viet, meaning_vi = EXCLUDED.meaning_vi, is_primary = EXCLUDED.is_primary, deleted_at = NULL`,
        [id, r.pinyin, r.hanViet, r.meaningVi, r.isPrimary],
      )
    }
    await q.query(`DELETE FROM character_parts WHERE char_id = $1`, [id])
    if (input.parts.length) {
      await q.query(
        `INSERT INTO character_parts (char_id, position, part)
         SELECT $1, t.ord, t.part FROM unnest($2::text[]) WITH ORDINALITY AS t(part, ord)`,
        [id, input.parts],
      )
    }
    // Parts are not synced on their own; touching the character makes /bundle pick it up.
    await q.query(`UPDATE characters SET updated_at = now() WHERE id = $1`, [id])
    return true
  })
  if (!found) return c.json({ error: 'not_found' }, 404)
  return c.json(await getAdminCharacter(id))
})

// ---------- words ----------

const ADMIN_WORD_JSON = `json_build_object(
  'id', w.id, 'word', w.word, 'traditional', w.traditional, 'pinyin', w.pinyin, 'hanViet', w.han_viet,
  'meaningVi', w.meaning_vi, 'hsk2Level', w.hsk2_level, 'hsk3Level', w.hsk3_level,
  'status', w.status, 'updatedAt', w.updated_at)`

const WORD_READY = `w.meaning_vi IS NOT NULL AND w.pinyin IS NOT NULL`

// Each word is shown with the reading the app will pick for every character in it, so a
// reviewer sees at once when 行 in 银行 would come out as xíng instead of háng.
async function withCharacters(words: any[]) {
  const hanzi = [...new Set(words.flatMap((w) => [...w.word]))]
  const { rows } = await db().query(
    `SELECT c.hanzi, json_agg(json_build_object('pinyin', r.pinyin, 'hanViet', r.han_viet,
       'meaningVi', r.meaning_vi, 'isPrimary', r.is_primary)) AS readings
     FROM characters c JOIN character_readings r ON r.char_id = c.id AND r.deleted_at IS NULL
     WHERE c.hanzi = ANY($1) AND c.deleted_at IS NULL GROUP BY c.hanzi`,
    [hanzi],
  )
  const byHanzi = new Map(rows.map((r) => [r.hanzi as string, r as unknown as Character]))
  return words.map((w) => ({
    ...w,
    characters: [...w.word].map((h, i) => {
      const ch = byHanzi.get(h)
      const r = ch ? readingInWord(ch, w, i) : null
      return { hanzi: h, pinyin: r?.pinyin ?? null, hanViet: r?.hanViet ?? null, meaningVi: r?.meaningVi ?? null }
    }),
  }))
}

admin.get('/words', async (c) => {
  const f = listFilter(c, 'w', `(w.word = $Q OR w.pinyin ILIKE $LIKE OR w.han_viet ILIKE $LIKE OR w.meaning_vi ILIKE $LIKE)`)
  const { rows } = await db().query(
    `SELECT ${ADMIN_WORD_JSON} AS data, count(*) OVER () AS total
     FROM words w WHERE ${f.where} ORDER BY ${f.col}, w.id ${f.page}`,
    f.params,
  )
  return c.json({ total: Number(rows[0]?.total ?? 0), items: await withCharacters(rows.map((r) => r.data)) })
})

admin.put('/words/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json().catch(() => null)
  const pinyin = text(body?.pinyin)
  if (!pinyin) throw new BadRequest('Từ phải có pinyin')
  const { rows } = await db().query(
    `UPDATE words SET traditional = $2, pinyin = $3, han_viet = $4, meaning_vi = $5
     WHERE id = $1 AND deleted_at IS NULL RETURNING ${ADMIN_WORD_JSON.replaceAll('w.', 'words.')} AS data`,
    [id, text(body?.traditional), pinyin, text(body?.hanViet), text(body?.meaningVi)],
  )
  if (!rows[0]) return c.json({ error: 'not_found' }, 404)
  return c.json((await withCharacters([rows[0].data]))[0])
})

// ---------- review ----------

const TABLE: Record<Kind, { table: string; alias: string; ready: string }> = {
  characters: { table: 'characters', alias: 'c', ready: CHARACTER_READY },
  words: { table: 'words', alias: 'w', ready: WORD_READY },
}

// Marks rows reviewed (only those complete enough to ship) or sends them back to draft.
// Returns which ids changed and which were refused, so the page can say why.
admin.post('/:kind{characters|words}/review', async (c) => {
  const t = TABLE[c.req.param('kind') as Kind]
  const body = await c.req.json().catch(() => null)
  const ids = (Array.isArray(body?.ids) ? body.ids : []).filter(Number.isInteger) as number[]
  const status = body?.status === 'draft' ? 'draft' : 'reviewed'
  if (!ids.length) throw new BadRequest('Không có dòng nào được chọn')
  const guard = status === 'reviewed' ? `AND ${t.ready}` : ''
  const { rows } = await db().query(
    `UPDATE ${t.table} AS ${t.alias} SET status = $2
     WHERE ${t.alias}.id = ANY($1) AND ${t.alias}.deleted_at IS NULL ${guard} RETURNING ${t.alias}.id`,
    [ids, status],
  )
  const changed = new Set(rows.map((r) => r.id as number))
  return c.json({ status, changed: [...changed], refused: ids.filter((id) => !changed.has(id)) })
})

admin.get('/stats', async (c) => {
  const col = levelColumn(c.req.query('std'))
  const q = (table: string) =>
    db().query(
      `SELECT ${col} AS level, count(*)::int AS total, count(*) FILTER (WHERE status = 'reviewed')::int AS reviewed
       FROM ${table} WHERE deleted_at IS NULL AND ${col} IS NOT NULL GROUP BY 1 ORDER BY 1`,
    )
  const [chars, words] = await Promise.all([q('characters'), q('words')])
  return c.json({ characters: chars.rows, words: words.rows })
})

admin.onError((err, c) => {
  if (err instanceof BadRequest) return c.json({ error: err.message }, 400)
  console.error(err)
  return c.json({ error: 'internal_error' }, 500)
})
