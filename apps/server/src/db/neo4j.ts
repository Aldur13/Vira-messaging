import neo4j from 'neo4j-driver'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dir, '../../.env') })

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
  { disableLosslessIntegers: true },
)

export default driver

type Params = Record<string, unknown>
type NeoRecord = { keys: readonly PropertyKey[]; get(key: string): unknown }

function toObj(record: NeoRecord): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const key of record.keys) {
    const val = record.get(String(key))
    obj[String(key)] = val && typeof val === 'object' && 'properties' in (val as object)
      ? (val as { properties: unknown }).properties
      : val
  }
  return obj
}

export async function run<T = Record<string, unknown>>(
  cypher: string,
  params: Params = {},
  write = false,
): Promise<T[]> {
  const session = driver.session({
    database: process.env.NEO4J_DATABASE,
    defaultAccessMode: write ? neo4j.session.WRITE : neo4j.session.READ,
  })
  try {
    const result = await session.run(cypher, params)
    return result.records.map(r => toObj(r) as T)
  } finally {
    await session.close()
  }
}

export const q  = <T = Record<string, unknown>>(cypher: string, params?: Params) => run<T>(cypher, params, false)
export const qw = <T = Record<string, unknown>>(cypher: string, params?: Params) => run<T>(cypher, params, true)

export async function verifyConnection() {
  const session = driver.session({ database: process.env.NEO4J_DATABASE })
  try {
    await session.run('RETURN 1')
    return true
  } catch {
    return false
  } finally {
    await session.close()
  }
}
