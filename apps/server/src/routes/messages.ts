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

  // Edit a message (author only)
  app.put<{ Params: { id: string }; Body: { content: string; encryptedContent?: string } }>(
    '/:id',
    { onRequest: [authenticate] },
    async (req, reply) => {
      const { content, encryptedContent } = req.body
      if (!content?.trim()) return reply.code(400).send({ error: 'content is required' })

      const uid = userId(req)
      const mid = req.params.id

      const canEdit = await q(
        'MATCH (u:User {id: $uid})-[:SENT]->(m:Message {id: $mid}) RETURN m.id',
        { uid, mid },
      )
      if (canEdit.length === 0) return reply.code(403).send({ error: 'Cannot edit this message' })

      const storedContent = encryptedContent ? '' : content.trim()
      await qw(
        `MATCH (m:Message {id: $mid})
         SET m.content = $storedContent,
             m.encryptedContent = $enc,
             m.isEncrypted = $isEnc,
             m.editedAt = datetime()`,
        { mid, storedContent, enc: encryptedContent ?? null, isEnc: !!encryptedContent },
      )

      const updated = await q<{ content: string; encryptedContent?: string; editedAt: string }>(
        'MATCH (m:Message {id: $mid}) RETURN m.content, m.encryptedContent, m.editedAt',
        { mid },
      )

      return {
        id: mid,
        content: updated[0]?.content ?? content.trim(),
        encryptedContent: updated[0]?.encryptedContent ?? null,
        editedAt: updated[0]?.editedAt,
      }
    },
  )

  // Get thread replies for a message
  app.get<{ Params: { id: string } }>(
    '/:id/replies',
    { onRequest: [authenticate] },
    async (req) => {
      const mid = req.params.id
      const rows = await q<Record<string, unknown>>(
        `MATCH (parent:Message {id: $mid})
         MATCH (reply:Message)-[:REPLY_TO]->(parent)
         MATCH (author:User)-[:SENT]->(reply)
         RETURN reply.id, reply.channelId, reply.content, reply.encryptedContent,
                reply.isEncrypted, reply.createdAt, reply.editedAt,
                author.id, author.username, author.initials, author.color
         ORDER BY reply.createdAt ASC`,
        { mid },
      )
      return rows.map(r => ({
        id: r['reply.id'],
        channelId: r['reply.channelId'],
        authorId: r['author.id'],
        content: r['reply.content'],
        encryptedContent: r['reply.encryptedContent'],
        isEncrypted: r['reply.isEncrypted'],
        timestamp: r['reply.createdAt'],
        editedAt: r['reply.editedAt'],
        author: {
          id: r['author.id'],
          username: r['author.username'],
          initials: r['author.initials'],
          color: r['author.color'],
        },
      }))
    },
  )

  // Create a reply to a message (thread)
  app.post<{ Params: { id: string }; Body: { content: string; encryptedContent?: string } }>(
    '/:id/replies',
    { onRequest: [authenticate] },
    async (req, reply) => {
      const { content, encryptedContent } = req.body
      if (!content?.trim()) return reply.code(400).send({ error: 'content is required' })

      const uid = userId(req)
      const parentId = req.params.id

      // Check if parent message exists and user has access
      const parentRows = await q(
        `MATCH (p:Message {id: $pid})-[:IN_CHANNEL]->(c:Channel)
         MATCH (u:User {id: $uid})-[:MEMBER_OF]->(:Server)-[:HAS_CHANNEL]->(c)
         RETURN p.channelId`,
        { pid: parentId, uid },
      )
      if (parentRows.length === 0) return reply.code(403).send({ error: 'Cannot reply to this message' })

      const channelId = parentRows[0]['p.channelId']
      const replyId = uuid()
      const storedContent = encryptedContent ? '' : content.trim()

      await qw(
        `MATCH (u:User {id: $uid}), (p:Message {id: $pid}), (c:Channel {id: $cid})
         CREATE (m:Message {
           id: $rid, content: $storedContent, encryptedContent: $enc,
           isEncrypted: $isEnc, channelId: $cid, createdAt: datetime()
         })
         CREATE (u)-[:SENT]->(m)
         CREATE (m)-[:REPLY_TO]->(p)
         CREATE (m)-[:IN_CHANNEL]->(c)
         SET p.replyCount = COALESCE(p.replyCount, 0) + 1`,
        { uid, pid: parentId, rid: replyId, cid: channelId, storedContent, enc: encryptedContent ?? null, isEnc: !!encryptedContent },
      )

      return { id: replyId, parentMessageId: parentId }
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
