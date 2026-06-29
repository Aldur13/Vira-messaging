import type { FastifyInstance } from 'fastify'
import { v4 as uuid } from 'uuid'
import { q, qw } from '../db/neo4j.js'
import { authenticate, userId } from '../middleware/auth.js'

export async function dmRoutes(app: FastifyInstance) {
  // List all DM conversations for the current user
  app.get(
    '/',
    { onRequest: [authenticate] },
    async (req) => {
      const uid = userId(req)
      const rows = await q<{
        id: string
        recipientId: string
        recipientUsername: string
        lastMessageTime: string | null
      }>(
        `MATCH (u:User {id: $uid})-[:MEMBER_OF]->(c:Channel {type: 'direct'})
         MATCH (u2:User)-[:MEMBER_OF]->(c)
         WHERE u2.id <> $uid
         OPTIONAL MATCH (c)<-[:IN_CHANNEL]-(m:Message)
         WITH c.id AS id, u2.id AS recipientId, u2.username AS recipientUsername, max(m.createdAt) AS lastMessageTime
         RETURN id, recipientId, recipientUsername, lastMessageTime
         ORDER BY lastMessageTime DESC`,
        { uid },
      )
      return rows
    },
  )

  // Get or create a DM conversation with a user
  app.post<{ Body: { recipientId: string } }>(
    '/',
    { onRequest: [authenticate] },
    async (req) => {
      const uid = userId(req)
      const { recipientId } = req.body

      if (!recipientId) return { error: 'recipientId is required' }
      if (uid === recipientId) return { error: 'Cannot create DM with yourself' }

      // Check if recipient exists
      const recipientExists = await q('MATCH (u:User {id: $rid}) RETURN u.id', { rid: recipientId })
      if (recipientExists.length === 0) return { error: 'User not found' }

      // Check if DM conversation already exists
      const existing = await q<{ id: string }>(
        `MATCH (u1:User {id: $uid})-[:MEMBER_OF]->(c:Channel {type: 'direct'})<-[:MEMBER_OF]-(u2:User {id: $rid})
         RETURN c.id AS id`,
        { uid, rid: recipientId },
      )

      if (existing.length > 0) {
        return { id: existing[0].id }
      }

      // Create new DM channel
      const cid = uuid()
      await qw(
        `MATCH (u1:User {id: $uid}), (u2:User {id: $rid})
         CREATE (c:Channel {
           id: $cid, type: 'direct', name: $name,
           createdAt: datetime()
         })
         CREATE (u1)-[:MEMBER_OF]->(c)
         CREATE (u2)-[:MEMBER_OF]->(c)`,
        { uid, rid: recipientId, cid, name: `dm-${Math.random().toString(36).slice(2)}` },
      )

      return { id: cid }
    },
  )

  // Get DM channel by recipient ID
  app.get<{ Params: { recipientId: string } }>(
    '/:recipientId',
    { onRequest: [authenticate] },
    async (req) => {
      const uid = userId(req)
      const { recipientId } = req.params

      const rows = await q<{ id: string; recipientUsername: string }>(
        `MATCH (u1:User {id: $uid})-[:MEMBER_OF]->(c:Channel {type: 'direct'})<-[:MEMBER_OF]-(u2:User {id: $rid})
         RETURN c.id AS id, u2.username AS recipientUsername`,
        { uid, rid: recipientId },
      )

      if (rows.length === 0) return { error: 'DM conversation not found' }
      return rows[0]
    },
  )
}
