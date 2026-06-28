import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { q, qw } from '../db/neo4j.js'
import { authenticate, userId } from '../middleware/auth.js'

const GRADIENTS = [
  'linear-gradient(135deg,#f97316,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#6366f1)',
  'linear-gradient(135deg,#4ade80,#06b6d4)',
  'linear-gradient(135deg,#a78bfa,#ec4899)',
  'linear-gradient(135deg,#fbbf24,#f97316)',
  'linear-gradient(135deg,#7c6ef5,#06b6d4)',
]

function pickColor() {
  return GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)]
}

function makeDisc() {
  return String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
}

interface RegisterBody { username: string; email: string; password: string }
interface LoginBody    { username: string; password: string }

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterBody }>('/register', async (req, reply) => {
    const { username, email, password } = req.body
    if (!username?.trim() || !email?.trim() || !password) {
      return reply.code(400).send({ error: 'username, email, and password are required' })
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: 'Password must be at least 6 characters' })
    }

    const existing = await q(
      'MATCH (u:User) WHERE u.username = $username OR u.email = $email RETURN u.id AS id',
      { username: username.trim(), email: email.trim().toLowerCase() },
    )
    if (existing.length > 0) {
      return reply.code(409).send({ error: 'Username or email already taken' })
    }

    const id           = uuid()
    const passwordHash = await bcrypt.hash(password, 12)
    const initials     = username.trim().slice(0, 2).toUpperCase()
    const color        = pickColor()
    const discriminator = makeDisc()

    await qw(
      `CREATE (:User {
        id: $id, username: $username, email: $email,
        passwordHash: $passwordHash, initials: $initials,
        color: $color, discriminator: $discriminator,
        status: 'online', badges: [], createdAt: datetime()
      })`,
      { id, username: username.trim(), email: email.trim().toLowerCase(), passwordHash, initials, color, discriminator },
    )

    const token = app.jwt.sign({ sub: id, username: username.trim() }, { expiresIn: '30d' })
    return reply.code(201).send({
      token,
      user: { id, username: username.trim(), initials, color, discriminator, status: 'online', badges: [] },
    })
  })

  app.post<{ Body: LoginBody }>('/login', async (req, reply) => {
    const { username, password } = req.body
    if (!username || !password) {
      return reply.code(400).send({ error: 'username and password are required' })
    }

    const rows = await q<{ u: Record<string, string> }>(
      'MATCH (u:User {username: $username}) RETURN u',
      { username: username.trim() },
    )
    if (rows.length === 0) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const u = rows[0].u as Record<string, string>
    const valid = await bcrypt.compare(password, u.passwordHash)
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const token = app.jwt.sign({ sub: u.id, username: u.username }, { expiresIn: '30d' })
    return {
      token,
      user: {
        id: u.id, username: u.username, initials: u.initials,
        color: u.color, discriminator: u.discriminator,
        status: u.status, badges: u.badges ?? [],
      },
    }
  })

  app.get('/me', { onRequest: [authenticate] }, async (req) => {
    const rows = await q<{ u: Record<string, string> }>(
      'MATCH (u:User {id: $id}) RETURN u',
      { id: userId(req) },
    )
    if (rows.length === 0) throw new Error('User not found')
    const u = rows[0].u as Record<string, string>
    return { id: u.id, username: u.username, initials: u.initials, color: u.color, discriminator: u.discriminator, status: u.status, badges: u.badges ?? [] }
  })

  app.patch<{ Body: { status: string } }>('/status', { onRequest: [authenticate] }, async (req) => {
    const allowed = ['online', 'idle', 'dnd', 'offline']
    const { status } = req.body
    if (!allowed.includes(status)) throw new Error('Invalid status')
    await qw('MATCH (u:User {id: $id}) SET u.status = $status', { id: userId(req), status })
    return { status }
  })
}
