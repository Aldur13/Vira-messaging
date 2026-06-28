export type Status    = 'online' | 'idle' | 'dnd' | 'offline'
export type ChannelType = 'text' | 'voice' | 'stage' | 'media'
export type MemberRole  = 'owner' | 'admin' | 'mod' | 'member'
export type BadgeType   = 'booster' | 'new' | 'admin'

export interface User {
  id: string
  username: string
  discriminator: string
  initials: string
  color: string
  status: Status
  statusText?: string
  badges?: BadgeType[]
}

export interface Server {
  id: string
  name: string
  initials: string
  color?: string
  ownerId?: string
  memberCount?: number
  role?: MemberRole
}

export interface Channel {
  id: string
  serverId: string
  name: string
  type: ChannelType
  description?: string
  unreadCount?: number
  userLimit?: number
  activeUserIds?: string[]
}

export interface MessageReaction {
  emoji: string
  count: number
  reactedByMe: boolean
}

export interface MessageAuthor {
  id: string
  username: string
  initials: string
  color: string
}

export interface Message {
  id: string
  channelId: string
  authorId: string
  content: string
  timestamp: string
  reactions?: MessageReaction[]
  isSystem?: boolean
  isEncrypted?: boolean
  encryptedContent?: string | null
  decryptedContent?: string | null
  author?: MessageAuthor
}

export interface ServerMember {
  serverId: string
  userId: string
  role: MemberRole
  nickname?: string
}

export interface TypingUser {
  userId: string
  username: string
  since: number
}
