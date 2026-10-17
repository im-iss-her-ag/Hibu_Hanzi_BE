import { app } from './app'
import { db, withRequestConnection } from './db'

// Cloudflare Workers entry (wrangler deploy). Each request gets its own Postgres connection
// through Hyperdrive, which keeps the real pool to Supabase warm between requests.
// Secrets: ADMIN_TOKEN (wrangler secret put). Binding: HYPERDRIVE (wrangler.toml).

interface Env {
  HYPERDRIVE: { connectionString: string }
  RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> }
  ADMIN_TOKEN?: string
}

interface Ctx {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

export default {
  async fetch(request: Request, env: Env, ctx: Ctx) {
    // Per-IP limit (DESIGN.md §10), same 120/min as the Node server. The admin page is
    // token-protected and pages through thousands of rows, so it is left out.
    const path = new URL(request.url).pathname
    if (env.RATE_LIMITER && !path.startsWith('/admin')) {
      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
      const { success } = await env.RATE_LIMITER.limit({ key: ip })
      if (!success) return Response.json({ error: 'too_many_requests' }, { status: 429 })
    }
    return withRequestConnection(
      env.HYPERDRIVE.connectionString,
      async () => app.fetch(request, env, ctx as never),
      (closing) => ctx.waitUntil(closing),
    )
  },

  // Daily Cron Trigger: keeps the Supabase free project from auto-pausing after 7 idle days.
  async scheduled(_event: unknown, env: Env, ctx: Ctx) {
    ctx.waitUntil(
      withRequestConnection(env.HYPERDRIVE.connectionString, async () => {
        await db().query('SELECT 1')
        console.log('[Supabase Keep-Alive] ping ok')
      }),
    )
  },
}
