import type { FastifyInstance } from 'fastify'
import { qw, q } from '../db/neo4j.js'
import { authenticate, userId } from '../middleware/auth.js'

export async function keyRoutes(app: FastifyInstance) {
  // Upload or update the current user's public identity key
  app.post<{ Body: { publicKey: string } }>(
    '/keys',
    { onRequest: [authenticate] },
    async (req, reply) => {
      const { publicKey } = req.body
      if (!publicKey) return reply.code(400).send({ error: 'publicKey is required' })
      await qw(
        'MATCH (u:User {id: $id}) SET u.publicKey = $key, u.keyUpdatedAt = datetime()',
        { id: userId(req), key: publicKey },
      )
      return { ok: true }
    },
  )

  // Get the current user's public key
  app.get('/keys/me', { onRequest: [authenticate] }, async (req) => {
    const rows = await q<{ key: string }>(
      'MATCH (u:User {id: $id}) RETURN u.publicKey AS key',
      { id: userId(req) },
    )
    return { publicKey: rows[0]?.key ?? null }
  })

  // Get a specific user's public key
  app.get<{ Params: { uid: string } }>(
    '/keys/:uid',
    { onRequest: [authenticate] },
    async (req, reply) => {
      const rows = await q<{ key: string }>(
        'MATCH (u:User {id: $uid}) RETURN u.publicKey AS key',
        { uid: req.params.uid },
      )
      if (rows.length === 0) return reply.code(404).send({ error: 'User not found' })
      return { userId: req.params.uid, publicKey: rows[0].key ?? null }
    },
  )
}
