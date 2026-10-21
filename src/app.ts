import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { admin, type AdminBindings } from './admin'
import { describePart, readingInWord, splitWord, type CharacterDetail, type WordDetail } from './core'
import { getBundle, getCharacters, getComponents, getPartCharacters, getVersion, getWord } from './queries'

// The API itself, shared by both entry points: src/index.ts (Node, local) and
// src/worker.ts (Cloudflare Workers, production). Neither runtime detail leaks in here.

export const app = new Hono<{ Bindings: AdminBindings }>()

app.use(cors())

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
  const [components, partChars] = await Promise.all([getComponents(forms), getPartCharacters(forms)])

  const { radical } = character
  const detail: CharacterDetail = {
    character,
    radical: radical ? describePart(radical, components, partChars, radical) : null,
    parts: character.parts.map((p) => describePart(p.part, components, partChars, radical)),
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
