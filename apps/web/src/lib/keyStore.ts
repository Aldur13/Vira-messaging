import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface ViraDB extends DBSchema {
  identity: {
    key: string
    value: { publicKey: Uint8Array; secretKey: Uint8Array }
  }
  channelKeys: {
    key: string
    value: Uint8Array
  }
}

let _db: IDBPDatabase<ViraDB> | null = null

async function db(): Promise<IDBPDatabase<ViraDB>> {
  if (_db) return _db
  _db = await openDB<ViraDB>('vira-keys', 1, {
    upgrade(d) {
      d.createObjectStore('identity')
      d.createObjectStore('channelKeys')
    },
  })
  return _db
}

export const keyStore = {
  async getIdentityKey(): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array } | null> {
    const val = await (await db()).get('identity', 'self')
    if (!val) return null
    const toU8 = (v: unknown) => v instanceof Uint8Array ? v : new Uint8Array(v as ArrayBuffer)
    return { publicKey: toU8(val.publicKey), secretKey: toU8(val.secretKey) }
  },
  async saveIdentityKey(pair: { publicKey: Uint8Array; secretKey: Uint8Array }) {
    await (await db()).put('identity', pair, 'self')
  },
  async getChannelKey(channelId: string): Promise<Uint8Array | null> {
    const val = await (await db()).get('channelKeys', channelId)
    if (!val) return null
    // IndexedDB may return ArrayBuffer instead of Uint8Array depending on browser
    return val instanceof Uint8Array ? val : new Uint8Array(val)
  },
  async saveChannelKey(channelId: string, key: Uint8Array) {
    await (await db()).put('channelKeys', key, channelId)
  },
  async clearAll() {
    const d = await db()
    await d.clear('identity')
    await d.clear('channelKeys')
  },
}
