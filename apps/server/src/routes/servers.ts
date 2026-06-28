import type { FastifyInstance } from 'fastify'
import { v4 as uuid } from 'uuid'
import { q, qw } from '../db/neo4j.js'
import { authenticate, userId } from '../middleware/auth.js'

interface CreateServerBody { name: string; initials?: string; color?: string }

export async function serverRoutes(app: FastifyInstance) {
  // List servers the current user belongs to
  app.get('/', { onRequest: [authenticate] }, async (req) => {
    const rows = await q<{ s: Record<string, string>; role: string }>(
      `MATCH (u:User {id: $id})-[m:MEMBER_OF]->(s:Server)
       RETURN s { .id, .name, .initials, .color, .memberCount, createdAt: toString(s.createdAt) } AS s,
              m.role AS role
       ORDER BY s.createdAt`,
      { id: userId(req) },
    )
    return rows.map(r => ({ ...r.s, role: r.role }))
  })

  // Create a server
  app.post<{ Body: CreateServerBody }>('/', { onRequest: [authenticate] }, async (req, reply) => {
    const { name, color } = req.body
    if (!name?.trim()) return reply.code(400).send({ error: 'Server name is required' })

    const id       = uuid()
    const initials = req.body.initials ?? name.trim().slice(0, 2).toUpperCase()
    const uid      = userId(req)

    await qw(
      `MATCH (u:User {id: $uid})
       CREATE (s:Server {id: $id, name: $name, initials: $initials, color: $color, memberCount: 1, createdAt: datetime()})
       CREATE (u)-[:OWNS]->(s)
       CREATE (u)-[:MEMBER_OF {role: 'owner', joinedAt: datetime()}]->(s)
       CREATE (general:Channel {id: $chanId, name: 'general', type: 'text', description: 'Main channel', serverId: $id, createdAt: datetime()})
       CREATE (s)-[:HAS_CHANNEL]->(general)`,
      { uid, id, name: name.trim(), initials, color: color ?? null, chanId: uuid() },
    )

    return reply.code(201).send({ id, name: name.trim(), initials, color: color ?? null, memberCount: 1, role: 'owner' })
  })

  // Get server details
  app.get<{ Params: { id: string } }>('/:id', { onRequest: [authenticate] }, async (req, reply) => {
    const rows = await q<{ s: Record<string, unknown>; role: string }>(
      `MATCH (u:User {id: $uid})-[m:MEMBER_OF]->(s:Server {id: $sid})
       RETURN s, m.role AS role`,
      { uid: userId(req), sid: req.params.id },
    )
    if (rows.length === 0) return reply.code(404).send({ error: 'Server not found or access denied' })
    return { ...rows[0].s, role: rows[0].role }
  })

  // Get server members
  app.get<{ Params: { id: string } }>('/:id/members', { onRequest: [authenticate] }, async (req) => {
    const rows = await q<{ u: Record<string, unknown>; role: string }>(
      `MATCH (u:User)-[m:MEMBER_OF]->(s:Server {id: $sid})
       RETURN u { .id, .username, .initials, .color, .discriminator, .status, .badges } AS u, m.role AS role
       ORDER BY
         CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'mod' THEN 2 ELSE 3 END,
         u.username`,
      { sid: req.params.id },
    )
    return rows.map(r => ({ ...r.u, role: r.role }))
  })

  // Get server channels
  app.get<{ Params: { id: string } }>('/:id/channels', { onRequest: [authenticate] }, async (req) => {
    const rows = await q<{ c: Record<string, unknown> }>(
      `MATCH (s:Server {id: $sid})-[:HAS_CHANNEL]->(c:Channel)
       RETURN c ORDER BY c.createdAt`,
      { sid: req.params.id },
    )
    return rows.map(r => r.c)
  })

  // Join a server (invite system — simplified: any user can join by ID for now)
  app.post<{ Params: { id: string } }>('/:id/join', { onRequest: [authenticate] }, async (req, reply) => {
    const uid = userId(req)
    const sid = req.params.id

    const already = await q(
      'MATCH (u:User {id: $uid})-[:MEMBER_OF]->(s:Server {id: $sid}) RETURN u.id',
      { uid, sid },
    )
    if (already.length > 0) return reply.code(409).send({ error: 'Already a member' })

    const server = await q<{ s: Record<string, unknown> }>(
      'MATCH (s:Server {id: $sid}) RETURN s',
      { sid },
    )
    if (server.length === 0) return reply.code(404).send({ error: 'Server not found' })

    await qw(
      `MATCH (u:User {id: $uid}), (s:Server {id: $sid})
       CREATE (u)-[:MEMBER_OF {role: 'member', joinedAt: datetime()}]->(s)
       SET s.memberCount = s.memberCount + 1`,
      { uid, sid },
    )
    return { joined: true }
  })

  // Leave a server
  app.delete<{ Params: { id: string } }>('/:id/leave', { onRequest: [authenticate] }, async (req) => {
    const uid = userId(req)
    const sid = req.params.id
    await qw(
      `MATCH (u:User {id: $uid})-[m:MEMBER_OF]->(s:Server {id: $sid})
       DELETE m
       SET s.memberCount = CASE WHEN s.memberCount > 0 THEN s.memberCount - 1 ELSE 0 END`,
      { uid, sid },
    )
    return { left: true }
  })
}
