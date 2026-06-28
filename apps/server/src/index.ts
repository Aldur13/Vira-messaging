import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'
import { authRoutes }    from './routes/auth.js'
import { serverRoutes }  from './routes/servers.js'
import { channelRoutes } from './routes/channels.js'
import { messageRoutes } from './routes/messages.js'
import { keyRoutes }     from './routes/keys.js'
import { setupWebSocket } from './ws/gateway.js'
import { verifyConnection } from './db/neo4j.js'
import driver from './db/neo4j.js'

const app = Fastify({
  logger: {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  },
})

await app.register(cors, {
  origin: ['http://localhost:5173'],
  credentials: true,
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
})

await app.register(websocket)

// Routes
await app.register(authRoutes,    { prefix: '/auth' })
await app.register(keyRoutes,     { prefix: '/auth' })
await app.register(serverRoutes,  { prefix: '/servers' })
await app.register(channelRoutes, { prefix: '/channels' })
await app.register(messageRoutes, { prefix: '/messages' })
await app.register(setupWebSocket)

app.get('/health', async () => ({
  status: 'ok',
  time: new Date().toISOString(),
  service: 'vira-server',
}))

// Boot
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
