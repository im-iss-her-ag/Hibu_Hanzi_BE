import { serve } from '@hono/node-server'
import { getConnInfo } from '@hono/node-server/conninfo'
import { Hono } from 'hono'
import { app } from './app'
import { usePool } from './db'

// Node entry, for local development (npm run dev). Production runs src/worker.ts.

const pool = usePool(process.env.DATABASE_URL)
const server = new Hono()

// Fixed-window limit per IP (DESIGN.md §10). In memory, so it resets on restart and is per
// process. On Workers this is done by a Cloudflare Rate Limiting Rule instead.
const WINDOW_MS = 60_000
const MAX_REQUESTS = 120
const hits = new Map<string, { count: number; resetAt: number }>()

server.use(async (c, next) => {
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

// Supabase Keep-Alive: Ping 1 ngày 1 lần để chống auto-pause (Free tier tự tắt sau 7 ngày không dùng).
// On Workers the same ping is a daily Cron Trigger (src/worker.ts, wrangler.toml).
const ONE_DAY_MS = 24 * 60 * 60 * 1000
async function pingSupabaseKeepAlive() {
  try {
    await pool.query('SELECT 1')
    console.log(`[Supabase Keep-Alive] Đã ping giữ kết nối thành công lúc ${new Date().toLocaleString('vi-VN')}`)
  } catch (err) {
    console.error('[Supabase Keep-Alive] Lỗi ping:', err instanceof Error ? err.message : err)
  }
}
setTimeout(pingSupabaseKeepAlive, 15_000)
setInterval(pingSupabaseKeepAlive, ONE_DAY_MS).unref()

server.route('/', app)

const port = Number(process.env.PORT ?? 3000)
serve({ fetch: server.fetch, port }, () => console.log(`API at http://localhost:${port}`))
