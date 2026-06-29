// Empty string = same origin (production: Fastify serves both API and frontend)
// Dev: Vite proxy forwards /auth, /servers, etc. to localhost:3001 automatically
const BASE = ''

async function req<T>(
  path: string,
  opts: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers: extraHeaders, ...rest } = opts
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extraHeaders ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    username: string
    initials: string
    color: string
    discriminator: string
    status: string
    badges: string[]
  }
}

export const api = {
  auth: {
    register: (body: { username: string; email: string; password: string }) =>
      req<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { username: string; password: string }) =>
      req<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: (token: string) => req<AuthResponse['user']>('/auth/me', { token }),
    status: (token: string, status: string) =>
      req('/auth/status', { method: 'PATCH', token, body: JSON.stringify({ status }) }),
    uploadKey: (token: string, publicKey: string) =>
      req('/auth/keys', { method: 'POST', token, body: JSON.stringify({ publicKey }) }),
  },
  servers: {
    list:     (token: string) => req<Record<string, unknown>[]>('/servers', { token }),
    create:   (token: string, body: { name: string; initials?: string; color?: string }) =>
      req<Record<string, unknown>>('/servers', { method: 'POST', token, body: JSON.stringify(body) }),
    join:     (token: string, sid: string) =>
      req<Record<string, unknown>>(`/servers/${sid}/join`, { method: 'POST', token }),
    channels: (token: string, sid: string) =>
      req<Record<string, unknown>[]>(`/servers/${sid}/channels`, { token }),
    members:  (token: string, sid: string) =>
      req<Record<string, unknown>[]>(`/servers/${sid}/members`, { token }),
  },
  channels: {
    create: (token: string, serverId: string, body: { name: string; type: string; description?: string }) =>
      req<Record<string, unknown>>(`/channels/server/${serverId}`, { method: 'POST', token, body: JSON.stringify(body) }),
    messages: (token: string, cid: string, before?: string) => {
      const qs = before ? `?before=${encodeURIComponent(before)}` : ''
      return req<Record<string, unknown>[]>(`/channels/${cid}/messages${qs}`, { token })
    },
    memberKeys: (token: string, cid: string) =>
      req<{ userId: string; publicKey: string }[]>(`/channels/${cid}/member-keys`, { token }),
  },
  messages: {
    react: (token: string, mid: string, emoji: string) =>
      req(`/messages/${mid}/react`, { method: 'POST', token, body: JSON.stringify({ emoji }) }),
  },
}
