import { AsyncLocalStorage } from 'node:async_hooks'
import pg from 'pg'

// One way for queries to reach Postgres on both runtimes:
//   Node (src/index.ts)    a long-lived Pool, as before.
//   Worker (src/worker.ts) one connection per request through Hyperdrive. Workers cannot keep
//                          sockets between requests, and Hyperdrive does the pooling instead.
// Code calls db() and does not care which one it got.

export interface Queryable {
  query<R extends pg.QueryResultRow = any>(text: string, values?: unknown[]): Promise<pg.QueryResult<R>>
}

let pool: pg.Pool | null = null

export function usePool(connectionString: string | undefined) {
  pool = new pg.Pool({ connectionString, keepAlive: true, connectionTimeoutMillis: 10_000 })
  pool.on('error', (err) => {
    console.error('[DB Pool] Lỗi kết nối CSDL đột ngột:', err.message)
  })
  return pool
}

// Connects on the first query, so a request that never touches the database (a CORS
// preflight, a 400 on bad input) never opens a connection.
class RequestConnection implements Queryable {
  private client: Promise<pg.Client> | null = null

  constructor(private readonly connectionString: string) {}

  private connect() {
    return (this.client ??= (async () => {
      const client = new pg.Client({ connectionString: this.connectionString })
      await client.connect()
      return client
    })())
  }

  async query<R extends pg.QueryResultRow = any>(text: string, values?: unknown[]) {
    return (await this.connect()).query<R>(text, values)
  }

  async close() {
    if (this.client) await (await this.client).end()
  }
}

const perRequest = new AsyncLocalStorage<RequestConnection>()

// Runs fn with its own connection and closes it afterwards. `defer` lets the Worker close
// the socket after the response has gone out (ctx.waitUntil) instead of making it wait.
export async function withRequestConnection<T>(
  connectionString: string,
  fn: () => Promise<T>,
  defer: (p: Promise<unknown>) => void = (p) => void p,
): Promise<T> {
  const conn = new RequestConnection(connectionString)
  try {
    return await perRequest.run(conn, fn)
  } finally {
    defer(conn.close().catch((err) => console.error('[DB] Lỗi đóng kết nối:', err)))
  }
}

export function db(): Queryable {
  const conn = perRequest.getStore() ?? pool
  if (!conn) throw new Error('No database: call usePool() or withRequestConnection() first')
  return conn as Queryable
}

// BEGIN/COMMIT on one connection. A per-request connection is already a single connection;
// the Pool lends one out for the duration.
export async function transaction<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
  const scoped = perRequest.getStore()
  const lent = scoped ? null : await pool!.connect()
  const client = (scoped ?? lent) as Queryable
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    lent?.release()
  }
}
