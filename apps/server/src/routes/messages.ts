import type { FastifyInstance } from 'fastify'
import { v4 as uuid } from 'uuid'
import { q, qw } from '../db/neo4j.js'
import { authenticate, userId } from '../middleware/auth.js'

export async function messageRoutes(app: FastifyInstance) {
  // Add/toggle reaction on a message
  app.post<{ Params: { id: string }; Body: { emoji: string } }>(
    '/:id/react',
    { onRequest: [authenticate] },
    async (req, reply) => {
      const { emoji } = req.body
      if (!emoji) return reply.code(400).send({ error: 'emoji is required' })

      const uid = userId(req)
      const mid = req.params.id

      // Check if already reacted
      const existing = await q(
        'MATCH (u:User {id: $uid})-[r:REACTED {emoji: $emoji}]->(m:Message {id: $mid}) RETURN r',
        { uid, emoji, mid },
      )

      if (existing.length > 0) {
        // Remove reaction
        await qw(
          'MATCH (u:User {id: $uid})-[r:REACTED {emoji: $emoji}]->(m:Message {id: $mid}) DELETE r',
          { uid, emoji, mid },
        )
        return { action: 'removed', emoji }
      } else {
        // Add reaction
        await qw(
          `MATCH (u:User {id: $uid}), (m:Message {id: $mid})
           CREATE (u)-[:REACTED {emoji: $emoji, createdAt: datetime()}]->(m)`,
          { uid, emoji, mid },
        )
        return { action: 'added', emoji }
      }
    },
  )

  // Get reaction counts for a message
  app.get<{ Params: { id: string } }>(
    '/:id/reactions',
    { onRequest: [authenticate] },
    async (req) => {
      const uid = userId(req)
      const rows = await q<{ emoji: string; count: number; reactedByMe: boolean }>(
        `MATCH (u:User)-[r:REACTED]->(m:Message {id: $mid})
         WITH r.emoji AS emoji, count(u) AS count,
              any(u2 IN collect(u) WHERE u2.id = $uid) AS reactedByMe
         RETURN emoji, count, reactedByMe
         ORDER BY count DESC`,
        { mid: req.params.id, uid },
      )
      return rows
    },
  )

  // Delete a message (author or server owner/mod)
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (req, reply) => {
      const uid = userId(req)

      const canDelete = await q(
        `MATCH (u:User {id: $uid})-[:SENT]->(m:Message {id: $mid})
         RETURN m.id
         UNION
         MATCH (u2:User {id: $uid})-[mem:MEMBER_OF]->(s:Server)-[:HAS_CHANNEL]->(:Channel)<-[:IN_CHANNEL]-(m:Message {id: $mid})
         WHERE mem.role IN ['owner','admin','mod']
         RETURN m.id`,
        { uid, mid: req.params.id },
      )
      if (canDelete.length === 0) return reply.code(403).send({ error: 'Cannot delete this message' })

      await qw('MATCH (m:Message {id: $mid}) DETACH DELETE m', { mid: req.params.id })
      return { deleted: true }
    },
  )
}
