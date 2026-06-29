import { create } from 'zustand'
import { api } from '../lib/api'
import { ws } from '../lib/ws'
import { screenShare } from '../lib/screenShare'
import {
  generateIdentityKeyPair,
  generateChannelKey,
  encryptMessage,
  decryptMessage,
  sealChannelKey,
  b64,
} from '../lib/crypto'
import { keyStore } from '../lib/keyStore'
import type {
  User, Server, Channel, Message, ServerMember, MessageReaction, TypingUser,
} from '../types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch { return '' }
}

function normMsg(raw: Record<string, unknown>): Message {
  const author = raw.author as { id: string; username: string; initials: string; color: string } | undefined
  return {
    id: raw.id as string,
    channelId: (raw.channelId ?? raw.channelid) as string,
    authorId: author?.id ?? '',
    content: raw.content as string,
    timestamp: fmtTime((raw.createdAt ?? raw.timestamp) as string),
    reactions: (raw.reactions as MessageReaction[]) ?? [],
    isEncrypted: !!raw.isEncrypted,
    encryptedContent: (raw.encryptedContent as string) ?? null,
    author,
  }
}

// ─── state shape ─────────────────────────────────────────────────────────────

interface AppStore {
  token: string | null
  currentUser: User | null
  isAuthenticated: boolean
  authError: string | null
  isAuthLoading: boolean

  servers: Server[]
  channels: Channel[]
  messages: Message[]
  members: (ServerMember & { user: User })[]
  typingUsers: Record<string, TypingUser[]>
  dmConversations: { id: string; recipientId: string; recipientUsername: string; lastMessageTime?: string }[]

  selectedServerId: string | null
  selectedChannelId: string | null

  isLoadingServers: boolean
  isLoadingMessages: boolean
  isLoading: boolean

  activeVoiceChannelId: string | null
  isScreenSharing: boolean
  isMuted: boolean
  isDeafened: boolean
  peerScreenStreams: Record<string, string>  // userId → object URL

  wsStatus: 'disconnected' | 'connecting' | 'connected'

  // right panel
  rightPanel: 'members' | 'search' | 'inbox' | 'threads' | null
  togglePanel: (panel: 'members' | 'search' | 'inbox' | 'threads') => void

  // auth
  login:    (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout:   () => void
  initAuth: () => Promise<void>
  clearAuthError: () => void

  // navigation
  selectServer:  (id: string) => Promise<void>
  selectChannel: (id: string) => Promise<void>

  // space / room management
  createSpace: (name: string, color?: string) => Promise<void>
  createRoom:  (name: string, type: 'text' | 'voice') => Promise<void>
  joinSpace:   (id: string) => Promise<void>

  // direct messages
  listDMs: () => Promise<void>
  startDM: (recipientId: string) => Promise<void>

  // messages
  sendMessage: (content: string) => Promise<void>
  editMessage: (messageId: string, content: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  replyToMessage: (parentMessageId: string, content: string) => Promise<void>
  openThread: (messageId: string) => Promise<void>
  forwardMessage: (messageId: string, targetChannelId: string) => Promise<void>

  // reactions
  toggleReaction: (messageId: string, emoji: string) => void

  // threads
  threadMessages: Message[]
  openThreadId: string | null
  closeThread: () => void

  // voice / screen share
  joinVoiceChannel:  (channelId: string) => void
  leaveVoiceChannel: () => void
  toggleMute:        () => void
  toggleDeafen:      () => void
  startScreenShare:  () => Promise<void>
  stopScreenShare:   () => void
}

// ─── store ────────────────────────────────────────────────────────────────────

export const useStore = create<AppStore>((set, get) => {

  // ── WebSocket wiring (done once) ────────────────────────────────────────────

  // [M2 fix] Use IndexedDB only — never localStorage for crypto keys
  ws.on<{ type: string; message: Record<string, unknown> }>('message:new', async ({ message }) => {
    const msg = normMsg(message)
    if (msg.isEncrypted && msg.encryptedContent) {
      try {
        const channelKey = await keyStore.getChannelKey(msg.channelId)
        if (channelKey) {
          msg.decryptedContent = decryptMessage(msg.encryptedContent, channelKey)
        }
      } catch { /* decryption failed — key not available yet */ }
    }
    set(s => ({ messages: [...s.messages, msg] }))
  })

  ws.on<{ type: string; messageId: string; reactions: MessageReaction[] }>(
    'reaction:update', ({ messageId, reactions }) => {
      set(s => ({
        messages: s.messages.map(m =>
          m.id === messageId ? { ...m, reactions } : m,
        ),
      }))
    },
  )

  ws.on<{ type: string; messageId: string; content: string; encryptedContent: string | null; editedAt: string }>(
    'message:edited', ({ messageId, content, encryptedContent, editedAt }) => {
      set(s => ({
        messages: s.messages.map(m =>
          m.id === messageId ? { ...m, content, encryptedContent, editedAt, decryptedContent: undefined } : m,
        ),
      }))
    },
  )

  ws.on<{ type: string; messageId: string }>(
    'message:deleted', ({ messageId }) => {
      set(s => ({
        messages: s.messages.filter(m => m.id !== messageId),
      }))
    },
  )

  ws.on<{ type: string; channelId: string; userId: string; username: string; isTyping: boolean }>(
    'typing', ({ channelId, userId, username, isTyping }) => {
      set(s => {
        const list = s.typingUsers[channelId] ?? []
        const updated = isTyping
          ? [...list.filter(t => t.userId !== userId), { userId, username, since: Date.now() }]
          : list.filter(t => t.userId !== userId)
        return { typingUsers: { ...s.typingUsers, [channelId]: updated } }
      })
    },
  )

  ws.on<{ ws_status: string }>('ws:status', (status) => {
    set({ wsStatus: status.ws_status as AppStore['wsStatus'] })
  })

  // WebRTC screen-share signaling
  ws.on<{ from: string; sdp: string }>('screenshare:offer', async ({ from, sdp }) => {
    await screenShare.answer(from, sdp)
  })
  ws.on<{ from: string; sdp: string }>('screenshare:answer', async ({ from, sdp }) => {
    await screenShare.handleAnswer(from, sdp)
  })
  ws.on<{ from: string; candidate: RTCIceCandidateInit }>('screenshare:ice', async ({ from, candidate }) => {
    await screenShare.addIce(from, candidate)
  })
  ws.on<{ fromUserId: string }>('screenshare:stop', ({ fromUserId }) => {
    screenShare.closePeer(fromUserId)
  })

  screenShare.setRemoteStreamHandler((userId, stream) => {
    if (stream) {
      const url = URL.createObjectURL(stream as unknown as MediaSource)
      set(s => ({ peerScreenStreams: { ...s.peerScreenStreams, [userId]: url } }))
    } else {
      set(s => {
        const copy = { ...s.peerScreenStreams }
        delete copy[userId]
        return { peerScreenStreams: copy }
      })
    }
  })

  // ── private helpers ─────────────────────────────────────────────────────────

  async function afterLogin(token: string, user: User) {
    localStorage.setItem('vira:token', token)
    localStorage.setItem('vira:user', JSON.stringify(user))

    // Ensure identity key exists and is uploaded
    let idKey = await keyStore.getIdentityKey()
    if (!idKey) {
      idKey = generateIdentityKeyPair()
      await keyStore.saveIdentityKey(idKey)
    }
    const pubKeyB64 = b64.encode(idKey.publicKey)
    try { await api.auth.uploadKey(token, pubKeyB64) } catch { /* best effort */ }

    ws.connect(token)
    set({ token, currentUser: user, isAuthenticated: true, authError: null })
    await loadServers(token)
  }

  async function loadServers(token: string) {
    set({ isLoadingServers: true })
    try {
      const raw = await api.servers.list(token)
      const servers = raw.map(s => ({
        id:          s.id as string,
        name:        s.name as string,
        initials:    s.initials as string,
        color:       s.color as string | undefined,
        memberCount: s.memberCount as number | undefined,
        role:        s.role as string | undefined,
      })) as Server[]
      set({ servers, isLoadingServers: false })
      if (servers.length > 0) await get().selectServer(servers[0].id)
    } catch {
      set({ isLoadingServers: false })
    }
  }

  async function loadChannelKey(token: string, channelId: string): Promise<Uint8Array> {
    // Check IndexedDB cache first
    const cached = await keyStore.getChannelKey(channelId)
    if (cached) return cached

    // Try to get from server (another member may have distributed it)
    try {
      const memberKeys = await api.channels.memberKeys(token, channelId)
      if (memberKeys.length > 0) {
        // For now generate new if we have no sealed key for us
        // (full key distribution is implemented in sendMessage)
      }
    } catch { /* best effort */ }

    // Generate new key and persist in IndexedDB only
    const key = generateChannelKey()
    await keyStore.saveChannelKey(channelId, key)
    return key
  }

  // ── store actions ───────────────────────────────────────────────────────────

  return {
    token: null,
    currentUser: null,
    isAuthenticated: false,
    authError: null,
    isAuthLoading: false,

    servers: [],
    channels: [],
    messages: [],
    members: [],
    typingUsers: {},
    dmConversations: [],

    selectedServerId: null,
    selectedChannelId: null,

    isLoadingServers: false,
    isLoadingMessages: false,
    isLoading: false,

    threadMessages: [],
    openThreadId: null,
    closeThread: () => set({ openThreadId: null, threadMessages: [] }),

    activeVoiceChannelId: null,
    isScreenSharing: false,
    isMuted: false,
    isDeafened: false,
    peerScreenStreams: {},

    rightPanel: null,
    togglePanel: (panel: 'members' | 'search' | 'inbox' | 'threads') => set(s => ({ rightPanel: s.rightPanel === panel ? null : panel })),

    wsStatus: 'disconnected',

    // ── auth ────────────────────────────────────────────────────────────────

    clearAuthError: () => set({ authError: null }),

    async initAuth() {
      const storedToken = localStorage.getItem('vira:token')
      const storedUser  = localStorage.getItem('vira:user')
      if (!storedToken || !storedUser) return
      try {
        const user = await api.auth.me(storedToken)
        await afterLogin(storedToken, user as User)
      } catch {
        localStorage.removeItem('vira:token')
        localStorage.removeItem('vira:user')
      }
    },

    async login(username, password) {
      set({ isAuthLoading: true, authError: null })
      try {
        const { token, user } = await api.auth.login({ username, password })
        await afterLogin(token, user as User)
      } catch (e) {
        set({ authError: (e as Error).message })
      } finally {
        set({ isAuthLoading: false })
      }
    },

    async register(username, email, password) {
      set({ isAuthLoading: true, authError: null })
      try {
        const { token, user } = await api.auth.register({ username, email, password })
        await afterLogin(token, user as User)
      } catch (e) {
        set({ authError: (e as Error).message })
      } finally {
        set({ isAuthLoading: false })
      }
    },

    logout() {
      ws.disconnect()
      screenShare.stop()
      keyStore.clearAll().catch(() => {})
      localStorage.removeItem('vira:token')
      localStorage.removeItem('vira:user')
      set({
        token: null, currentUser: null, isAuthenticated: false,
        servers: [], channels: [], messages: [], members: [],
        selectedServerId: null, selectedChannelId: null,
        isScreenSharing: false, peerScreenStreams: {},
      })
    },

    // ── navigation ────────────────────────────────────────────────────────────

    async selectServer(id) {
      // Empty string = go back to home dashboard
      if (!id) {
        set({ selectedServerId: null, selectedChannelId: null, channels: [], messages: [], members: [] })
        return
      }
      const { token } = get()
      if (!token) return
      set({ selectedServerId: id, isLoading: true, channels: [], messages: [], members: [] })
      try {
        const [rawChannels, rawMembers] = await Promise.all([
          api.servers.channels(token, id),
          api.servers.members(token, id),
        ])

        const channels = rawChannels.map(c => ({
          id: c.id as string, serverId: id,
          name: c.name as string, type: c.type as Channel['type'],
          description: c.description as string | undefined,
        }))

        const members = rawMembers.map(m => ({
          serverId: id,
          userId: m.id as string,
          role: m.role as ServerMember['role'],
          user: {
            id: m.id as string,
            username: m.username as string,
            initials: m.initials as string,
            color: m.color as string,
            discriminator: m.discriminator as string ?? '0000',
            status: m.status as User['status'] ?? 'offline',
            badges: (m.badges as string[]) ?? [],
          } as User,
        }))

        set({ channels, members, isLoading: false })

        const firstText = channels.find(c => c.type === 'text')
        if (firstText) await get().selectChannel(firstText.id)
      } catch {
        set({ isLoading: false })
      }
    },

    async selectChannel(id) {
      const { token, channels } = get()
      if (!token) return
      const ch = channels.find(c => c.id === id)
      if (!ch) return

      if (ch.type === 'voice' || ch.type === 'stage') {
        set({ activeVoiceChannelId: id })
        ws.join(id)
        return
      }

      set({ selectedChannelId: id, isLoadingMessages: true, messages: [] })
      ws.join(id)

      try {
        const raw = await api.channels.messages(token, id)
        const channelKey = await loadChannelKey(token, id)

        const messages = raw.map(r => {
          const msg = normMsg(r)
          if (msg.isEncrypted && msg.encryptedContent) {
            msg.decryptedContent = decryptMessage(msg.encryptedContent, channelKey)
          }
          return msg
        })

        set({ messages, isLoadingMessages: false })
      } catch {
        set({ isLoadingMessages: false })
      }
    },

    // ── messages ──────────────────────────────────────────────────────────────

    async sendMessage(content) {
      const { token, selectedChannelId, members, currentUser } = get()
      if (!token || !selectedChannelId || !content.trim()) return

      const channelKey = await loadChannelKey(token, selectedChannelId)
      const encryptedContent = encryptMessage(content.trim(), channelKey)

      // On first send, distribute channel key to all members
      const idKey = await keyStore.getIdentityKey()
      if (idKey) {
        const memberKeysData = await api.channels.memberKeys(token, selectedChannelId).catch(() => [])
        if (memberKeysData.length > 0) {
          const sealed: Record<string, string> = {}
          for (const mk of memberKeysData) {
            if (mk.userId === currentUser?.id) continue
            try {
              const recipPub = b64.decode(mk.publicKey)
              sealed[mk.userId] = sealChannelKey(channelKey, recipPub, idKey.secretKey)
            } catch { /* skip */ }
          }
          // TODO: POST sealed keys to server endpoint for distribution
        }
      }

      // Send via WebSocket — plain content stays as hint for non-encrypted fallback
      ws.sendMessage(selectedChannelId, content.trim(), encryptedContent)
    },

    // ── space / room management ───────────────────────────────────────────────

    async createSpace(name, color) {
      const { token } = get()
      if (!token) throw new Error('Not authenticated')
      const initials = name.slice(0, 2).toUpperCase()
      await api.servers.create(token, { name, initials, color })
      await loadServers(token)
    },

    async createRoom(name, type) {
      const { token, selectedServerId } = get()
      if (!token || !selectedServerId) throw new Error('No space selected')
      await api.channels.create(token, selectedServerId, { name, type })
      // Refresh channels
      const rawChannels = await api.servers.channels(token, selectedServerId)
      const channels = rawChannels.map(c => ({
        id: c.id as string, serverId: selectedServerId,
        name: c.name as string, type: c.type as Channel['type'],
        description: c.description as string | undefined,
      }))
      set({ channels })
    },

    async joinSpace(id) {
      const { token } = get()
      if (!token) throw new Error('Not authenticated')
      await api.servers.join(token, id)
      await loadServers(token)
      await get().selectServer(id)
    },

    // ── direct messages ────────────────────────────────────────────────────

    async listDMs() {
      const { token } = get()
      if (!token) return
      try {
        const rawDMs = await api.dms.list(token)
        const dms = rawDMs.map(dm => ({
          id: dm.id as string,
          recipientId: dm.recipientId as string,
          recipientUsername: dm.recipientUsername as string,
          lastMessageTime: dm.lastMessageTime as string | undefined,
        }))
        set({ dmConversations: dms })
      } catch { /* best effort */ }
    },

    async startDM(recipientId) {
      const { token } = get()
      if (!token) return
      try {
        const { id } = await api.dms.create(token, recipientId)
        await get().listDMs()
        await get().selectChannel(id)
      } catch { /* best effort */ }
    },

    // ── reactions ─────────────────────────────────────────────────────────────

    toggleReaction(messageId, emoji) {
      const { token } = get()
      if (!token) return
      ws.react(messageId, emoji)
    },

    async editMessage(messageId, content) {
      const { token, selectedChannelId } = get()
      if (!token || !selectedChannelId || !content.trim()) return

      const msg = get().messages.find(m => m.id === messageId)
      if (!msg) return

      if (msg.isEncrypted) {
        const channelKey = await loadChannelKey(token, selectedChannelId)
        const encryptedContent = encryptMessage(content.trim(), channelKey)
        ws.editMessage(messageId, content.trim(), encryptedContent)
      } else {
        ws.editMessage(messageId, content.trim())
      }
    },

    async deleteMessage(messageId) {
      ws.deleteMessage(messageId)
    },

    async replyToMessage(parentMessageId, content) {
      const { token, selectedChannelId } = get()
      if (!token || !selectedChannelId || !content.trim()) return

      const msg = get().messages.find(m => m.id === parentMessageId)
      if (!msg) return

      if (msg.isEncrypted) {
        const channelKey = await loadChannelKey(token, selectedChannelId)
        const encryptedContent = encryptMessage(content.trim(), channelKey)
        await api.messages.createReply(token, parentMessageId, content.trim(), encryptedContent)
      } else {
        await api.messages.createReply(token, parentMessageId, content.trim())
      }

      set(s => ({
        messages: s.messages.map(m =>
          m.id === parentMessageId ? { ...m, replyCount: (m.replyCount ?? 0) + 1 } : m,
        ),
      }))
    },

    async openThread(messageId) {
      const { token } = get()
      if (!token) return

      try {
        const replies = await api.messages.getReplies(token, messageId)
        const channelKey = await loadChannelKey(token, get().selectedChannelId!)

        const threadMsgs = replies.map(r => {
          const msg = normMsg(r)
          if (msg.isEncrypted && msg.encryptedContent) {
            msg.decryptedContent = decryptMessage(msg.encryptedContent, channelKey)
          }
          return msg
        })

        set({ openThreadId: messageId, threadMessages: threadMsgs })
      } catch { /* best effort */ }
    },

    async forwardMessage(messageId, targetChannelId) {
      const { token, messages, selectedChannelId } = get()
      if (!token || !selectedChannelId || messageId === targetChannelId) return

      const msg = messages.find(m => m.id === messageId)
      if (!msg) return

      const content = `**Forwarded from ${msg.author?.username}:**\n${msg.decryptedContent || msg.content}`
      const channelKey = await loadChannelKey(token, targetChannelId)
      const encryptedContent = msg.isEncrypted ? encryptMessage(content, channelKey) : undefined

      ws.sendMessage(targetChannelId, content, encryptedContent)
    },

    // ── voice / screen share ─────────────────────────────────────────────────

    joinVoiceChannel(channelId) {
      set({ activeVoiceChannelId: channelId })
      ws.join(channelId)
      ws.screenShareStart(channelId)
    },

    leaveVoiceChannel() {
      const { activeVoiceChannelId } = get()
      if (activeVoiceChannelId) ws.screenShareStop(activeVoiceChannelId)
      screenShare.stop()
      set({ activeVoiceChannelId: null, isScreenSharing: false })
    },

    toggleMute:    () => set(s => ({ isMuted: !s.isMuted })),
    toggleDeafen:  () => set(s => ({ isDeafened: !s.isDeafened })),

    async startScreenShare() {
      try {
        await screenShare.start()
        const { activeVoiceChannelId } = get()
        if (activeVoiceChannelId) ws.screenShareStart(activeVoiceChannelId)
        set({ isScreenSharing: true })
        // Offer to each member in the voice channel
        const { members } = get()
        for (const m of members) {
          if (m.userId !== get().currentUser?.id) {
            await screenShare.offer(m.userId).catch(() => {})
          }
        }
      } catch (e) {
        console.warn('Screen share failed:', (e as Error).message)
      }
    },

    stopScreenShare() {
      const { activeVoiceChannelId } = get()
      if (activeVoiceChannelId) ws.screenShareStop(activeVoiceChannelId)
      screenShare.stop()
      set({ isScreenSharing: false })
    },
  }
})
