import type { FastifyInstance } from 'fastify'
import { v4 as uuid } from 'uuid'
import { q, qw } from '../db/neo4j.js'
import { authenticate, userId } from '../middleware/auth.js'

interface CreateChannelBody { name: string; type: 'text' | 'voice' | 'stage' | 'media'; description?: string }

export async function channelRoutes(app: FastifyInstance) {
  // Get channel info
  app.get<{ Params: { id: string } }>('/:id', { onRequest: [authenticate] }, async (req, reply) => {
    const rows = await q<{ c: Record<string, unknown> }>(
      `MATCH (u:User {id: $uid})-[:MEMBER_OF]->(s:Server)-[:HAS_CHANNEL]->(c:Channel {id: $cid})
       RETURN c`,
      { uid: userId(req), cid: req.params.id },
    )
    if (rows.length === 0) return reply.code(404).send({ error: 'Channel not found' })
    return rows[0].c
  })

  // Create channel in a server
  app.post<{ Params: { serverId: string }; Body: CreateChannelBody }>(
    '/server/:serverId',
    { onRequest: [authenticate] },
    async (req, reply) => {
      const { name, type, description } = req.body
      if (!name?.trim()) return reply.code(400).send({ error: 'Channel name is required' })

      // Only owner/admin/mod can create channels
      const perm = await q(
        `MATCH (u:User {id: $uid})-[m:MEMBER_OF]->(s:Server {id: $sid})
         WHERE m.role IN ['owner','admin','mod']
         RETURN m.role AS role`,
        { uid: userId(req), sid: req.params.serverId },
      )
      if (perm.length === 0) return reply.code(403).send({ error: 'Insufficient permissions' })

      const id = uuid()
      await qw(
        `MATCH (s:Server {id: $sid})
         CREATE (c:Channel {
           id: $id, name: $name, type: $type,
           description: $desc, serverId: $sid, createdAt: datetime()
         })
         CREATE (s)-[:HAS_CHANNEL]->(c)`,
        { sid: req.params.serverId, id, name: name.trim(), type: type ?? 'text', desc: description ?? '' },
      )
      return reply.code(201).send({ id, name: name.trim(), type, description: description ?? '', serverId: req.params.serverId })
    },
  )

  // Get messages in a channel (paginated, newest last)
  app.get<{ Params: { id: string }; Querystring: { before?: string; limit?: string } }>(
    '/:id/messages',
    { onRequest: [authenticate] },
    async (req, reply) => {
      const limit  = Math.floor(Math.min(Number(req.query.limit ?? 50), 100))
      const before = req.query.before

      // Verify membership
      const access = await q(
        `MATCH (u:User {id: $uid})-[:MEMBER_OF]->(s:Server)-[:HAS_CHANNEL]->(c:Channel {id: $cid})
         RETURN c.id`,
        { uid: userId(req), cid: req.params.id },
      )
      if (access.length === 0) return reply.code(403).send({ error: 'Access denied' })

      const cypher = before
        ? `MATCH (author:User)-[:SENT]->(m:Message)-[:IN_CHANNEL]->(c:Channel {id: $cid})
           WHERE m.createdAt < datetime($before)
           RETURN m { .id, .content, .channelId, createdAt: toString(m.createdAt), .isEncrypted, .encryptedContent } AS m,
                  author { .id, .username, .initials, .color } AS author
           ORDER BY m.createdAt DESC LIMIT toInteger($limit)`
        : `MATCH (author:User)-[:SENT]->(m:Message)-[:IN_CHANNEL]->(c:Channel {id: $cid})
           RETURN m { .id, .content, .channelId, createdAt: toString(m.createdAt), .isEncrypted, .encryptedContent } AS m,
                  author { .id, .username, .initials, .color } AS author
           ORDER BY m.createdAt DESC LIMIT toInteger($limit)`

      const params: Record<string, unknown> = { cid: req.params.id, limit }
      if (before) params.before = before

      const rows = await q<{ m: Record<string, unknown>; author: Record<string, unknown> }>(cypher, params)
      // Return oldest first for chat rendering
      return rows.reverse().map(r => ({ ...r.m, author: r.author }))
    },
  )

  // Get public keys of all members in a channel (for E2E key distribution)
  app.get<{ Params: { id: string } }>(
    '/:id/member-keys',
    { onRequest: [authenticate] },
    async (req, reply) => {
      const access = await q(
        `MATCH (u:User {id: $uid})-[:MEMBER_OF]->(s:Server)-[:HAS_CHANNEL]->(c:Channel {id: $cid})
         RETURN c.id`,
        { uid: userId(req), cid: req.params.id },
      )
      if (access.length === 0) return reply.code(403).send({ error: 'Access denied' })

      const rows = await q<{ uid: string; key: string }>(
        `MATCH (u:User)-[:MEMBER_OF]->(s:Server)-[:HAS_CHANNEL]->(c:Channel {id: $cid})
         WHERE u.publicKey IS NOT NULL
         RETURN u.id AS uid, u.publicKey AS key`,
        { cid: req.params.id },
      )
      return rows.map(r => ({ userId: r.uid, publicKey: r.key }))
    },
  )
}
