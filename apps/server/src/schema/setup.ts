import { qw, verifyConnection } from '../db/neo4j.js'
import driver from '../db/neo4j.js'

const constraints = [
  'CREATE CONSTRAINT user_id         IF NOT EXISTS FOR (u:User)    REQUIRE u.id IS UNIQUE',
  'CREATE CONSTRAINT user_username   IF NOT EXISTS FOR (u:User)    REQUIRE u.username IS UNIQUE',
  'CREATE CONSTRAINT user_email      IF NOT EXISTS FOR (u:User)    REQUIRE u.email IS UNIQUE',
  'CREATE CONSTRAINT server_id       IF NOT EXISTS FOR (s:Server)  REQUIRE s.id IS UNIQUE',
  'CREATE CONSTRAINT channel_id      IF NOT EXISTS FOR (c:Channel) REQUIRE c.id IS UNIQUE',
  'CREATE CONSTRAINT message_id      IF NOT EXISTS FOR (m:Message) REQUIRE m.id IS UNIQUE',
]

const indexes = [
  'CREATE INDEX msg_channel  IF NOT EXISTS FOR (m:Message) ON (m.channelId)',
  'CREATE INDEX msg_created  IF NOT EXISTS FOR (m:Message) ON (m.createdAt)',
  'CREATE INDEX user_status  IF NOT EXISTS FOR (u:User)    ON (u.status)',
  'CREATE INDEX chan_server  IF NOT EXISTS FOR (c:Channel) ON (c.serverId)',
]

async function main() {
  console.log('Connecting to Neo4j Aura...')
  const ok = await verifyConnection()
  if (!ok) { console.error('Cannot reach Neo4j'); process.exit(1) }
  console.log('Connected.\n')

  console.log('Creating constraints...')
  for (const c of constraints) {
    try { await qw(c); console.log('  ✓', c.slice(7, 50)) }
    catch (e) { console.error('  ✗', e) }
  }

  console.log('\nCreating indexes...')
  for (const idx of indexes) {
    try { await qw(idx); console.log('  ✓', idx.slice(7, 50)) }
    catch (e) { console.error('  ✗', e) }
  }

  console.log('\nSchema setup complete.')
  await driver.close()
}

main()
