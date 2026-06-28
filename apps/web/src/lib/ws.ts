// Auto-detect WebSocket URL from the current page's host.
// Works for both dev (proxied by Vite to localhost:3001) and
// production (same-origin wss:// served by Fastify on Railway).
function getWsBase(): string {
  if (typeof window === 'undefined') return 'ws://localhost:3001'
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}`
}

type Handler<T = unknown> = (data: T) => void

class ViraWsClient {
  private socket: WebSocket | null = null
  private token = ''
  private handlers = new Map<string, Set<Handler>>()
  private reconnectDelay = 1000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private activeChannelId: string | null = null
  private pending: object[] = []

  connect(token: string) {
    this.token = token
    this._open()
  }

  private _open() {
    if (this.socket?.readyState === WebSocket.OPEN) return
    const url = `${getWsBase()}/ws?token=${encodeURIComponent(this.token)}`
    this.socket = new WebSocket(url)

    this.socket.onopen = () => {
      this.reconnectDelay = 1000
      this._emit('ws:status', 'connected')
      if (this.activeChannelId) this._sendNow({ type: 'join', channelId: this.activeChannelId })
      const q = this.pending.splice(0)
      q.forEach(msg => this._sendNow(msg))
    }

    this.socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as { type: string }
        this._emit(data.type, data)
      } catch { /* ignore malformed */ }
    }

    this.socket.onclose = () => {
      this._emit('ws:status', 'disconnected')
      this._scheduleReconnect()
    }

    this.socket.onerror = () => this.socket?.close()
  }

  private _scheduleReconnect() {
    if (!this.token) return
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000)
      this._open()
    }, this.reconnectDelay)
  }

  disconnect() {
    this.token = ''
    this.activeChannelId = null
    this.pending = []
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null }
    this.socket?.close()
    this.socket = null
  }

  join(channelId: string) {
    this.activeChannelId = channelId
    this._send({ type: 'join', channelId })
  }

  sendMessage(channelId: string, content: string, encryptedContent?: string) {
    this._send({ type: 'message', channelId, content, encryptedContent })
  }

  typing(channelId: string, isTyping: boolean) {
    this._send({ type: 'typing', channelId, isTyping })
  }

  react(messageId: string, emoji: string) {
    this._send({ type: 'react', messageId, emoji })
  }

  screenShareOffer(to: string, sdp: string)  { this._send({ type: 'screenshare:offer',  to, sdp }) }
  screenShareAnswer(to: string, sdp: string) { this._send({ type: 'screenshare:answer', to, sdp }) }
  iceCandidate(to: string, candidate: RTCIceCandidateInit) { this._send({ type: 'screenshare:ice', to, candidate }) }
  screenShareStart(channelId: string)        { this._send({ type: 'screenshare:start', channelId }) }
  screenShareStop(channelId: string)         { this._send({ type: 'screenshare:stop',  channelId }) }

  private _sendNow(data: object) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    }
  }

  private _send(data: object) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this._sendNow(data)
    } else {
      this.pending.push(data)
    }
  }

  on<T = unknown>(event: string, handler: Handler<T>) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler as Handler)
    return () => this.off(event, handler)
  }

  off<T = unknown>(event: string, handler: Handler<T>) {
    this.handlers.get(event)?.delete(handler as Handler)
  }

  private _emit(event: string, data: unknown) {
    this.handlers.get(event)?.forEach(h => h(data))
  }
}

export const ws = new ViraWsClient()
