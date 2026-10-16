import { serve } from '@hono/node-server'
import { getConnInfo } from '@hono/node-server/conninfo'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { describePart, readingInWord, splitWord, type CharacterDetail, type WordDetail } from './core'
import { admin } from './admin'
import { getBundle, getCharacters, getComponents, getVersion, getWord } from './queries'

const app = new Hono()

app.use(cors())

// Fixed-window limit per IP (DESIGN.md §10). In memory, so it resets on restart and is per process.
const WINDOW_MS = 60_000
const MAX_REQUESTS = 120
const hits = new Map<string, { count: number; resetAt: number }>()

app.use(async (c, next) => {
  // The admin page is token-protected and pages through thousands of rows; it is not scraping.
  if (c.req.path.startsWith('/admin')) return next()
  const ip = getConnInfo(c).remote.address ?? 'unknown'
  const now = Date.now()
  let entry = hits.get(ip)
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_MS }
    hits.set(ip, entry)
  }
  if (++entry.count > MAX_REQUESTS) return c.json({ error: 'too_many_requests' }, 429)
  await next()
})

setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of hits) if (entry.resetAt <= now) hits.delete(ip)
}, WINDOW_MS).unref()

app.route('/admin', admin)

app.get('/version', async (c) => c.json({ version: await getVersion() }))

app.get('/bundle', async (c) => {
  const since = c.req.query('since') ?? null
  if (since !== null && !/^\d{1,20}$/.test(since)) return c.json({ error: 'invalid_since' }, 400)
  return c.json(await getBundle(since))
})

app.get('/characters/:hanzi', async (c) => {
  const hanzi = c.req.param('hanzi')
  if (splitWord(hanzi).length !== 1) return c.json({ error: 'invalid_hanzi' }, 400)

  const [character] = await getCharacters([hanzi])
  if (!character) return c.json({ error: 'not_found' }, 404)

  const forms = [...new Set([...character.parts.map((p) => p.part), ...(character.radical ? [character.radical] : [])])]
  const [components, partChars] = await Promise.all([getComponents(forms), getCharacters(forms)])

  const detail: CharacterDetail = {
    character,
    radical: character.radical ? describePart(character.radical, components, partChars) : null,
    parts: character.parts.map((p) => describePart(p.part, components, partChars)),
  }
  return c.json(detail)
})

app.get('/words/:word', async (c) => {
  const text = c.req.param('word')
  const hanzi = splitWord(text)
  if (hanzi.length < 1 || hanzi.length > 12) return c.json({ error: 'invalid_word' }, 400)

  const word = await getWord(text)
  if (!word) return c.json({ error: 'not_found' }, 404)

  const chars = await getCharacters([...new Set(hanzi)])
  const detail: WordDetail = {
    word,
    characters: hanzi.map((h, i) => {
      const character = chars.find((ch) => ch.hanzi === h) ?? null
      return { hanzi: h, character, reading: character ? readingInWord(character, word, i) : null }
    }),
  }
  return c.json(detail)
})

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'internal_error' }, 500)
})

const port = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port }, () => console.log(`API at http://localhost:${port}`))
