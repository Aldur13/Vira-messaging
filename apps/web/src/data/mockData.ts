import type { User, Server, Channel, Message, ServerMember } from '../types'

export const users: User[] = [
  { id: 'u1', username: 'aldur', discriminator: '0001', initials: 'AL', color: 'linear-gradient(135deg,#f97316,#ec4899)', status: 'online', badges: ['booster'] },
  { id: 'u2', username: 'marix', discriminator: '1337', initials: 'MX', color: 'linear-gradient(135deg,#06b6d4,#6366f1)', status: 'online', badges: ['new'] },
  { id: 'u3', username: 'zerayn', discriminator: '4200', initials: 'ZR', color: 'linear-gradient(135deg,#4ade80,#06b6d4)', status: 'online' },
  { id: 'u4', username: 'kira', discriminator: '7777', initials: 'KI', color: 'linear-gradient(135deg,#a78bfa,#ec4899)', status: 'idle' },
  { id: 'u5', username: 'tsuki', discriminator: '2024', initials: 'TS', color: 'linear-gradient(135deg,#fbbf24,#f97316)', status: 'dnd' },
  { id: 'u6', username: 'nova', discriminator: '0099', initials: 'NV', color: 'linear-gradient(135deg,#64748b,#475569)', status: 'offline' },
  { id: 'u7', username: 'ryxen', discriminator: '5500', initials: 'RX', color: 'linear-gradient(135deg,#475569,#334155)', status: 'offline' },
  { id: 'u8', username: 'solaris', discriminator: '3311', initials: 'SL', color: 'linear-gradient(135deg,#f59e0b,#ef4444)', status: 'online' },
]

export const servers: Server[] = [
  { id: 's1', name: 'Vira HQ', initials: 'V', ownerId: 'u1', memberCount: 36 },
  { id: 's2', name: 'Design Lab', initials: 'DL', color: 'linear-gradient(135deg,#f97316,#ec4899)', ownerId: 'u2', memberCount: 12 },
  { id: 's3', name: 'Dev Zone', initials: 'DZ', color: 'linear-gradient(135deg,#06b6d4,#6366f1)', ownerId: 'u3', memberCount: 28 },
  { id: 's4', name: 'Gaming Den', initials: 'GD', color: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', ownerId: 'u5', memberCount: 91 },
]

export const channels: Channel[] = [
  // s1 — Vira HQ
  { id: 'c1', serverId: 's1', name: 'welcome', type: 'text', description: 'Start here' },
  { id: 'c2', serverId: 's1', name: 'general', type: 'text', description: 'Main hangout for Vira HQ' },
  { id: 'c3', serverId: 's1', name: 'design', type: 'text', unreadCount: 3 },
  { id: 'c4', serverId: 's1', name: 'dev-talk', type: 'text', unreadCount: 12 },
  { id: 'c5', serverId: 's1', name: 'media-share', type: 'media' },
  { id: 'c6', serverId: 's1', name: 'Lounge', type: 'voice', activeUserIds: ['u1','u2','u3','u5','u6','u7'] },
  { id: 'c7', serverId: 's1', name: 'Gaming Room', type: 'voice', activeUserIds: ['u4'] },
  { id: 'c8', serverId: 's1', name: 'Stage', type: 'stage', activeUserIds: [] },
  // s2 — Design Lab
  { id: 'c9',  serverId: 's2', name: 'general', type: 'text' },
  { id: 'c10', serverId: 's2', name: 'critique', type: 'text', unreadCount: 2 },
  { id: 'c11', serverId: 's2', name: 'Design Crit', type: 'voice', activeUserIds: [] },
  // s3 — Dev Zone
  { id: 'c12', serverId: 's3', name: 'general', type: 'text' },
  { id: 'c13', serverId: 's3', name: 'code-review', type: 'text', unreadCount: 5 },
  { id: 'c14', serverId: 's3', name: 'Standup', type: 'voice', activeUserIds: [] },
  // s4 — Gaming Den
  { id: 'c15', serverId: 's4', name: 'general', type: 'text' },
  { id: 'c16', serverId: 's4', name: 'lfg', type: 'text', unreadCount: 8 },
  { id: 'c17', serverId: 's4', name: 'Squad Up', type: 'voice', activeUserIds: ['u8'] },
]

export const messages: Message[] = [
  {
    id: 'm1', channelId: 'c2', authorId: 'u1',
    content: "yo who's down for a voice call later? working on the new Vira UI and could use some eyes on it 👀",
    timestamp: '2:14 PM',
    reactions: [
      { emoji: '👀', count: 4, reactedByMe: true },
      { emoji: '🔥', count: 7, reactedByMe: false },
      { emoji: '✅', count: 2, reactedByMe: false },
    ],
  },
  {
    id: 'm2', channelId: 'c2', authorId: 'u2',
    content: "I'm in! loving the encrypted channels btw — finally a Discord alternative that doesn't sell your DMs lol",
    timestamp: '2:15 PM',
  },
  {
    id: 'm3', channelId: 'c2', authorId: 'u3',
    content: "same, jumping in Lounge now. also can someone screenshare their setup? curious what stack people are using",
    timestamp: '2:16 PM',
    reactions: [{ emoji: '🙌', count: 3, reactedByMe: false }],
  },
  {
    id: 'm4', channelId: 'c2', authorId: 'u4',
    content: 'omw, give me 5 mins',
    timestamp: '2:17 PM',
  },
  {
    id: 'm5', channelId: 'c2', authorId: 'u1',
    content: 'bet, also the E2E encryption is solid — using Signal Protocol under the hood, same as WhatsApp',
    timestamp: '2:18 PM',
  },
  {
    id: 'm6', channelId: 'c2', authorId: 'u1',
    content: 'server literally never sees plaintext, only ciphertext 🔐',
    timestamp: '2:18 PM',
    reactions: [{ emoji: '🔐', count: 6, reactedByMe: true }],
  },
  {
    id: 'm7', channelId: 'c2', authorId: 'u5',
    content: 'wait you actually implemented Signal Protocol?? that\'s wild lol',
    timestamp: '2:19 PM',
  },
  {
    id: 'm8', channelId: 'c2', authorId: 'u8',
    content: 'the voice quality is also way better than discord wtf',
    timestamp: '2:20 PM',
    reactions: [{ emoji: '💯', count: 9, reactedByMe: false }],
  },
]

export const serverMembers: ServerMember[] = [
  { serverId: 's1', userId: 'u1', role: 'owner' },
  { serverId: 's1', userId: 'u2', role: 'mod' },
  { serverId: 's1', userId: 'u3', role: 'member' },
  { serverId: 's1', userId: 'u4', role: 'member' },
  { serverId: 's1', userId: 'u5', role: 'member' },
  { serverId: 's1', userId: 'u6', role: 'member' },
  { serverId: 's1', userId: 'u7', role: 'member' },
  { serverId: 's1', userId: 'u8', role: 'member' },
  { serverId: 's2', userId: 'u2', role: 'owner' },
  { serverId: 's2', userId: 'u1', role: 'member' },
  { serverId: 's3', userId: 'u3', role: 'owner' },
  { serverId: 's4', userId: 'u5', role: 'owner' },
]
