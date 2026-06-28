import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { qw, q } from '../db/neo4j.js'
import driver from '../db/neo4j.js'

const GRADIENTS = [
  'linear-gradient(135deg,#f97316,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#6366f1)',
  'linear-gradient(135deg,#4ade80,#06b6d4)',
  'linear-gradient(135deg,#a78bfa,#ec4899)',
]

async function main() {
  console.log('Seeding Neo4j...')

  // Clear existing (dev only)
  await qw('MATCH (n) DETACH DELETE n')
  console.log('Cleared existing data.')

  // Create users
  const users = [
    { username: 'aldur',  email: 'aldur@vira.app',  initials: 'AL', color: GRADIENTS[0], password: 'password123' },
    { username: 'marix',  email: 'marix@vira.app',  initials: 'MX', color: GRADIENTS[1], password: 'password123' },
    { username: 'zerayn', email: 'zerayn@vira.app', initials: 'ZR', color: GRADIENTS[2], password: 'password123' },
  ]

  const userIds: Record<string, string> = {}
  for (const u of users) {
    const id = uuid()
    userIds[u.username] = id
    const hash = await bcrypt.hash(u.password, 10)
    await qw(
      `CREATE (:User {
        id: $id, username: $username, email: $email,
        passwordHash: $hash, initials: $initials, color: $color,
        discriminator: $disc, status: 'online',
        createdAt: datetime()
      })`,
      { id, username: u.username, email: u.email, hash, initials: u.initials, color: u.color, disc: '0001' },
    )
    console.log('  ✓ User:', u.username)
  }

  // Create Vira HQ server
  const serverId = uuid()
  await qw(
    `MATCH (owner:User {id: $ownerId})
     CREATE (s:Server {id: $id, name: 'Vira HQ', initials: 'V', color: null, createdAt: datetime()})
     CREATE (owner)-[:OWNS]->(s)
     CREATE (owner)-[:MEMBER_OF {role: 'owner', joinedAt: datetime()}]->(s)`,
    { id: serverId, ownerId: userIds['aldur'] },
  )

  // Add other users to server
  for (const username of ['marix', 'zerayn']) {
    await qw(
      `MATCH (u:User {id: $uid}), (s:Server {id: $sid})
       CREATE (u)-[:MEMBER_OF {role: 'member', joinedAt: datetime()}]->(s)`,
      { uid: userIds[username], sid: serverId },
    )
  }
  console.log('  ✓ Server: Vira HQ')

  // Create channels
  const channelDefs = [
    { name: 'welcome',     type: 'text',  description: 'Start here' },
    { name: 'general',     type: 'text',  description: 'Main hangout for Vira HQ' },
    { name: 'dev-talk',    type: 'text',  description: 'Dev discussions' },
    { name: 'Lounge',      type: 'voice', description: '' },
    { name: 'Gaming Room', type: 'voice', description: '' },
  ]
  const channelIds: Record<string, string> = {}
  for (const ch of channelDefs) {
    const id = uuid()
    channelIds[ch.name] = id
    await qw(
      `MATCH (s:Server {id: $sid})
       CREATE (c:Channel {id: $id, name: $name, type: $type, description: $desc, serverId: $sid, createdAt: datetime()})
       CREATE (s)-[:HAS_CHANNEL]->(c)`,
      { sid: serverId, id, name: ch.name, type: ch.type, desc: ch.description },
    )
  }
  console.log('  ✓ Channels created')

  // Create seed messages
  const msgs = [
    { author: 'aldur',  content: "yo who's down for a voice call? working on the new Vira UI 👀" },
    { author: 'marix',  content: "I'm in! loving the encrypted channels btw 🔐" },
    { author: 'zerayn', content: 'same, the E2E encryption is wild. server literally never sees plaintext' },
  ]
  for (const msg of msgs) {
    const id = uuid()
    const channelId = channelIds['general']
    await qw(
      `MATCH (u:User {id: $uid}), (c:Channel {id: $cid})
       CREATE (m:Message {
         id: $id, content: $content, channelId: $cid,
         encryptedContent: null, isEncrypted: false,
         createdAt: datetime()
       })
       CREATE (u)-[:SENT]->(m)
       CREATE (m)-[:IN_CHANNEL]->(c)`,
      { uid: userIds[msg.author], cid: channelId, id, content: msg.content },
    )
  }
  console.log('  ✓ Seed messages created')

  const count = await q('MATCH (n) RETURN count(n) AS total')
  console.log(`\nSeed complete. Total nodes: ${(count[0] as { total: number }).total}`)
  await driver.close()
}

main().catch(e => { console.error(e); process.exit(1) })
