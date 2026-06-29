import type { FastifyInstance } from 'fastify'
import type { WebSocket } from '@fastify/websocket'
import { v4 as uuid } from 'uuid'
import { q, qw } from '../db/neo4j.js'

// channelId → set of clients in that room
const rooms = new Map<string, Set<Client>>()
// userId → client (for direct/signaling messages)
const userSockets = new Map<string, Client>()

interface Client {
  ws: WebSocket
  userId: string
  username: string
}

function broadcast(channelId: string, payload: unknown, excludeId?: string) {
  const room = rooms.get(channelId)
  if (!room) return
  const data = JSON.stringify(payload)
  for (const c of room) {
    if (c.userId === excludeId) continue
    if (c.ws.readyState === 1) c.ws.send(data)
  }
}

function sendTo(userId: string, payload: unknown) {
  const c = userSockets.get(userId)
  if (c?.ws.readyState === 1) c.ws.send(JSON.stringify(payload))
}

function send(ws: WebSocket, payload: unknown) {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload))
}

type WsEvent =
  | { type: 'join';             channelId: string }
  | { type: 'leave';            channelId: string }
  | { type: 'message';          channelId: string; content: string; encryptedContent?: string }
  | { type: 'message:edit';     messageId: string; content: string; encryptedContent?: string }
  | { type: 'message:delete';   messageId: string }
  | { type: 'typing';           channelId: string; isTyping: boolean }
  | { type: 'react';            messageId: string; emoji: string }
  | { type: 'voice:join';       channelId: string }
  | { type: 'voice:leave';      channelId: string }
  | { type: 'screenshare:offer';  to: string; sdp: string }
  | { type: 'screenshare:answer'; to: string; sdp: string }
  | { type: 'screenshare:ice';    to: string; candidate: RTCIceCandidateInit }
  | { type: 'screenshare:start';  channelId: string }
  | { type: 'screenshare:stop';   channelId: string }
  | { type: 'ping' }

export async function setupWebSocket(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (socket, req) => {
    const token = (req.query as Record<string, string>).token
    let uid = '', uname = ''

    try {
      const p = app.jwt.verify<{ sub: string; username: string }>(token)
      uid = p.sub; uname = p.username
    } catch {
      send(socket, { type: 'error', message: 'Invalid token' })
      socket.close()
      return
    }

    const client: Client = { ws: socket, userId: uid, username: uname }
    const joined = new Set<string>()
    userSockets.set(uid, client)

    send(socket, { type: 'ready', userId: uid, username: uname })

    socket.on('message', async (raw: Buffer) => {
      // [H4] Reject oversized WS frames (64 KB max)
      if (raw.length > 65_536) {
        send(socket, { type: 'error', message: 'Message too large' })
        return
      }
      let event: WsEvent
      try { event = JSON.parse(raw.toString()) as WsEvent }
      catch { return }

      switch (event.type) {
        case 'ping':
          send(socket, { type: 'pong' })
          break

        case 'join': {
          if (!rooms.has(event.channelId)) rooms.set(event.channelId, new Set())
          rooms.get(event.channelId)!.add(client)
          joined.add(event.channelId)
          send(socket, { type: 'joined', channelId: event.channelId })
          break
        }

        case 'leave': {
          rooms.get(event.channelId)?.delete(client)
          joined.delete(event.channelId)
          break
        }

        case 'message': {
          const { channelId, content, encryptedContent } = event
          if (!content?.trim()) break

          const access = await q(
            `MATCH (u:User {id: $uid})-[:MEMBER_OF]->(:Server)-[:HAS_CHANNEL]->(c:Channel {id: $cid})
             RETURN c.id`,
            { uid, cid: channelId },
          )
          if (access.length === 0) {
            send(socket, { type: 'error', message: 'Not a member of this channel' })
            break
          }

          // [C1 fix] Never store plaintext when an encrypted version is provided
          const storedContent = encryptedContent ? '' : content.trim()
          const mid = uuid()
          await qw(
            `MATCH (u:User {id: $uid}), (c:Channel {id: $cid})
             CREATE (m:Message {
               id: $mid, content: $storedContent,
               encryptedContent: $enc, isEncrypted: $isEnc,
               channelId: $cid, createdAt: datetime()
             })
             CREATE (u)-[:SENT]->(m)
             CREATE (m)-[:IN_CHANNEL]->(c)`,
            { uid, cid: channelId, mid, storedContent, enc: encryptedContent ?? null, isEnc: !!encryptedContent },
          )

          const payload = {
            type: 'message:new',
            message: {
              id: mid, channelId,
              // [M4 fix] Only return plaintext when message is NOT encrypted
              content: encryptedContent ? '' : content.trim(),
              encryptedContent: encryptedContent ?? null,
              isEncrypted: !!encryptedContent,
              createdAt: new Date().toISOString(),
              author: { id: uid, username: uname, initials: uname.slice(0,2).toUpperCase(), color: '' },
            },
          }
          send(socket, payload)
          broadcast(channelId, payload, uid)
          break
        }

        case 'typing':
          broadcast(event.channelId, { type: 'typing', channelId: event.channelId, userId: uid, username: uname, isTyping: event.isTyping }, uid)
          break

        case 'message:edit': {
          const { messageId, content, encryptedContent } = event
          if (!content?.trim()) break

          const canEdit = await q(
            'MATCH (u:User {id: $uid})-[:SENT]->(m:Message {id: $mid}) RETURN m.id',
            { uid, mid: messageId },
          )
          if (canEdit.length === 0) break

          const storedContent = encryptedContent ? '' : content.trim()
          await qw(
            `MATCH (m:Message {id: $mid})
             SET m.content = $storedContent, m.encryptedContent = $enc, m.isEncrypted = $isEnc, m.editedAt = datetime()`,
            { mid: messageId, storedContent, enc: encryptedContent ?? null, isEnc: !!encryptedContent },
          )

          const chanRows = await q<{ cid: string }>(
            'MATCH (m:Message {id: $mid})-[:IN_CHANNEL]->(c:Channel) RETURN c.id AS cid',
            { mid: messageId },
          )
          if (chanRows.length > 0) {
            const rp = { type: 'message:edited', messageId, content: storedContent, encryptedContent: encryptedContent ?? null, editedAt: new Date().toISOString() }
            send(socket, rp)
            broadcast(chanRows[0].cid, rp, uid)
          }
          break
        }

        case 'message:delete': {
          const { messageId } = event

          const canDelete = await q(
            `MATCH (u:User {id: $uid})-[:SENT]->(m:Message {id: $mid})
             RETURN m.id
             UNION
             MATCH (u2:User {id: $uid})-[mem:MEMBER_OF]->(s:Server)-[:HAS_CHANNEL]->(:Channel)<-[:IN_CHANNEL]-(m:Message {id: $mid})
             WHERE mem.role IN ['owner','admin','mod']
             RETURN m.id`,
            { uid, mid: messageId },
          )
          if (canDelete.length === 0) break

          const chanRows = await q<{ cid: string }>(
            'MATCH (m:Message {id: $mid})-[:IN_CHANNEL]->(c:Channel) RETURN c.id AS cid',
            { mid: messageId },
          )

          await qw('MATCH (m:Message {id: $mid}) DETACH DELETE m', { mid: messageId })

          if (chanRows.length > 0) {
            const rp = { type: 'message:deleted', messageId }
            send(socket, rp)
            broadcast(chanRows[0].cid, rp, uid)
          }
          break
        }

        case 'react': {
          const { messageId, emoji } = event
          const existing = await q(
            'MATCH (u:User {id: $uid})-[r:REACTED {emoji: $emoji}]->(m:Message {id: $mid}) RETURN r',
            { uid, emoji, mid: messageId },
          )
          if (existing.length > 0) {
            await qw('MATCH (u:User {id: $uid})-[r:REACTED {emoji: $emoji}]->(m:Message {id: $mid}) DELETE r', { uid, emoji, mid: messageId })
          } else {
            await qw(
              `MATCH (u:User {id: $uid}), (m:Message {id: $mid})
               CREATE (u)-[:REACTED {emoji: $emoji, createdAt: datetime()}]->(m)`,
              { uid, emoji, mid: messageId },
            )
          }
          const counts = await q<{ emoji: string; count: number; reactedByMe: boolean }>(
            `MATCH (u:User)-[r:REACTED]->(m:Message {id: $mid})
             WITH r.emoji AS emoji, count(u) AS count, any(u2 IN collect(u) WHERE u2.id = $uid) AS reactedByMe
             RETURN emoji, count, reactedByMe`,
            { mid: messageId, uid },
          )
          const chanRows = await q<{ cid: string }>(
            'MATCH (m:Message {id: $mid})-[:IN_CHANNEL]->(c:Channel) RETURN c.id AS cid',
            { mid: messageId },
          )
          if (chanRows.length > 0) {
            const rp = { type: 'reaction:update', messageId, reactions: counts }
            send(socket, rp)
            broadcast(chanRows[0].cid, rp, uid)
          }
          break
        }

        // ── WebRTC screen share signaling ──────────────────────────────────────

        case 'screenshare:offer':
          sendTo(event.to, { type: 'screenshare:offer', from: uid, sdp: event.sdp })
          break

        case 'screenshare:answer':
          sendTo(event.to, { type: 'screenshare:answer', from: uid, sdp: event.sdp })
          break

        case 'screenshare:ice':
          sendTo(event.to, { type: 'screenshare:ice', from: uid, candidate: event.candidate })
          break

        case 'screenshare:start':
          broadcast(event.channelId, { type: 'screenshare:start', fromUserId: uid, username: uname, channelId: event.channelId }, uid)
          break

        case 'screenshare:stop':
          broadcast(event.channelId, { type: 'screenshare:stop', fromUserId: uid, channelId: event.channelId }, uid)
          break

        case 'voice:join':
          broadcast(event.channelId, { type: 'voice:joined', channelId: event.channelId, userId: uid, username: uname })
          break

        case 'voice:leave':
          broadcast(event.channelId, { type: 'voice:left', channelId: event.channelId, userId: uid })
          break
      }
    })

    socket.on('close', () => {
      userSockets.delete(uid)
      for (const cid of joined) {
        rooms.get(cid)?.delete(client)
        if (rooms.get(cid)?.size === 0) rooms.delete(cid)
      }
    })
  })
}
