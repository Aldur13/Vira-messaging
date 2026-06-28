import nacl from 'tweetnacl'

// Use browser-native APIs instead of tweetnacl-util (avoids CJS default-export interop issues)
const encodeUTF8  = (s: string): Uint8Array => new TextEncoder().encode(s)
const decodeUTF8  = (a: Uint8Array): string  => new TextDecoder().decode(a)
const encodeBase64 = (a: Uint8Array): string =>
  btoa(Array.from(a, c => String.fromCharCode(c)).join(''))
const decodeBase64 = (s: string): Uint8Array =>
  new Uint8Array(atob(s).split('').map(c => c.charCodeAt(0)))

export type KeyPair = { publicKey: Uint8Array; secretKey: Uint8Array }

/** Generate a new X25519 identity key pair. */
export function generateIdentityKeyPair(): KeyPair {
  return nacl.box.keyPair()
}

/** Generate a random 32-byte symmetric key for a channel. */
export function generateChannelKey(): Uint8Array {
  return nacl.randomBytes(nacl.secretbox.keyLength)
}

/**
 * Encrypt `channelKey` for a specific recipient.
 * Returns a base64-encoded blob: nonce (24 bytes) || ciphertext.
 */
export function sealChannelKey(
  channelKey: Uint8Array,
  recipientPublicKey: Uint8Array,
  senderSecretKey: Uint8Array,
): string {
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const box   = nacl.box(channelKey, nonce, recipientPublicKey, senderSecretKey)
  const out   = new Uint8Array(nonce.length + box.length)
  out.set(nonce)
  out.set(box, nonce.length)
  return encodeBase64(out)
}

/**
 * Decrypt a channel key that was sealed for us.
 * Returns null if decryption fails.
 */
export function openChannelKey(
  sealed: string,
  senderPublicKey: Uint8Array,
  recipientSecretKey: Uint8Array,
): Uint8Array | null {
  try {
    const data  = decodeBase64(sealed)
    const nonce = data.slice(0, nacl.box.nonceLength)
    const box   = data.slice(nacl.box.nonceLength)
    return nacl.box.open(box, nonce, senderPublicKey, recipientSecretKey)
  } catch {
    return null
  }
}

/**
 * Encrypt a plaintext message string with the channel's symmetric key.
 * Returns a base64-encoded blob: nonce (24 bytes) || ciphertext.
 */
export function encryptMessage(plaintext: string, channelKey: Uint8Array): string {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
  const box   = nacl.secretbox(encodeUTF8(plaintext), nonce, channelKey)
  const out   = new Uint8Array(nonce.length + box.length)
  out.set(nonce)
  out.set(box, nonce.length)
  return encodeBase64(out)
}

/**
 * Decrypt a message ciphertext.
 * Returns the plaintext string, or null if the key is wrong / data is corrupt.
 */
export function decryptMessage(ciphertext: string, channelKey: Uint8Array): string | null {
  try {
    const data  = decodeBase64(ciphertext)
    const nonce = data.slice(0, nacl.secretbox.nonceLength)
    const box   = data.slice(nacl.secretbox.nonceLength)
    const plain = nacl.secretbox.open(box, nonce, channelKey)
    return plain ? decodeUTF8(plain) : null
  } catch {
    return null
  }
}

export const b64 = {
  encode: encodeBase64,
  decode: decodeBase64,
}
