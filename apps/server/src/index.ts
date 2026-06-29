import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import staticFiles from '@fastify/static'
import websocket from '@fastify/websocket'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { authRoutes }    from './routes/auth.js'
import { serverRoutes }  from './routes/servers.js'
import { channelRoutes } from './routes/channels.js'
import { messageRoutes } from './routes/messages.js'
import { dmRoutes }      from './routes/dms.js'
import { previewRoutes } from './routes/preview.js'
import { keyRoutes }     from './routes/keys.js'
import { setupWebSocket } from './ws/gateway.js'
import { verifyConnection } from './db/neo4j.js'
import driver from './db/neo4j.js'

// [H1] Require a real JWT secret — fail fast
const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret || jwtSecret.length < 32) {
  console.error('FATAL: JWT_SECRET must be set in .env and be at least 32 characters')
  process.exit(1)
}

const __dir = dirname(fileURLToPath(import.meta.url))
// Resolves to apps/web/dist relative to apps/server/src/
const frontendDist = join(__dir, '../../web/dist')
const serveFrontend = existsSync(frontendDist)

const app = Fastify({
  logger: { transport: { target: 'pino-pretty', options: { colorize: true } } },
  bodyLimit: 65_536,   // [H4] 64 KB max body
})

// CORS — only needed in dev (same origin in production)
await app.register(cors, {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ],
  credentials: true,
})

await app.register(jwt, { secret: jwtSecret })

// [H3] Rate limiting
await app.register(rateLimit, {
  global: true,
  max: 120,
  timeWindow: '1 minute',
})

await app.register(websocket)

// ── API routes ───────────────────────────────────────────────────────────────
await app.register(authRoutes,    { prefix: '/auth' })
await app.register(keyRoutes,     { prefix: '/auth' })
await app.register(serverRoutes,  { prefix: '/servers' })
await app.register(channelRoutes, { prefix: '/channels' })
await app.register(messageRoutes, { prefix: '/messages' })
await app.register(dmRoutes,      { prefix: '/dms' })
await app.register(previewRoutes, { prefix: '/api/preview' })
await app.register(setupWebSocket)

app.get('/health', async () => ({
  status: 'ok',
  time: new Date().toISOString(),
  service: 'vira-server',
  frontend: serveFrontend ? 'bundled' : 'external',
}))

// ── Serve frontend (production) ──────────────────────────────────────────────
if (serveFrontend) {
  await app.register(staticFiles, {
    root: frontendDist,
    prefix: '/',
    decorateReply: false,
    // Don't catch API routes with the static handler
    constraints: {},
  })

  // SPA fallback — any unknown route returns index.html
  const apiPrefixes = ['/auth', '/servers', '/channels', '/messages', '/dms', '/api', '/health', '/ws']
  app.setNotFoundHandler((req, reply) => {
    const isApi = apiPrefixes.some(p => req.url.startsWith(p))
    if (isApi) {
      reply.code(404).send({ error: 'Not found' })
    } else {
      reply.sendFile('index.html')
    }
  })

  app.log.info(`Serving frontend from ${frontendDist}`)
}

// ── Boot ─────────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT ?? 3001)

app.log.info('Connecting to Neo4j Aura...')
const dbOk = await verifyConnection()
if (!dbOk) {
  app.log.error('Cannot reach Neo4j — check credentials in .env')
  process.exit(1)
}
app.log.info('Neo4j connected.')

try {
  await app.listen({ port, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  await driver.close()
  process.exit(1)
}
