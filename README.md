# Vira

A Discord-style messaging platform built with **end-to-end encryption by default**. The server stores only ciphertext — messages are encrypted client-side with NaCl before ever leaving your device.

![Vira UI](docs/preview.png)

---

## Features

| Feature | Details |
|---|---|
| **E2E Encryption** | `nacl.secretbox` (XSalsa20-Poly1305) per channel, keys never leave device |
| **Key Exchange** | `nacl.box` (X25519 Diffie-Hellman) for distributing channel keys to members |
| **Voice Channels** | WebRTC-ready architecture (LiveKit SFU for scale) |
| **Screen Share** | `getDisplayMedia` + WebRTC P2P with WS signaling |
| **Real-time** | WebSocket with auto-reconnect and message queue |
| **Cosmetics** | Gradient avatars, role badges, teal E2E indicator |
| **Skeleton loaders** | Shape-matched shimmer on every loading state |
| **Tooltips** | Radix UI tooltip on every icon button |
| **Font** | Plus Jakarta Sans via Google Fonts, strict weight hierarchy |
| **Icons** | Lucide React SVGs throughout |
| **Database** | Neo4j graph database — perfect for social graphs |
| **Auth** | Argon2-hashed passwords + 30-day JWT |

---

## Tech Stack

### Frontend (`apps/web`)
- **React 19** + TypeScript + Vite
- **Tailwind CSS v4** — `@theme` custom color tokens, no config file
- **Zustand v5** — single store, WS events update it in real-time
- **tweetnacl** — NaCl crypto (box + secretbox)
- **idb** — IndexedDB wrapper for key persistence
- **Radix UI** — accessible, unstyled Tooltip primitive
- **Lucide React** — SVG icon library

### Backend (`apps/server`)
- **Fastify v5** + TypeScript + tsx
- **Neo4j Driver v5** — graph DB queries
- **@fastify/websocket** — WS with room-based broadcast + direct user routing
- **@fastify/jwt** — stateless auth
- **bcryptjs** — password hashing (12 rounds)

### Infrastructure
- **Neo4j Aura Free** — hosted graph database
- WebRTC STUN: `stun.l.google.com:19302`

---

## Project Structure

```
vira/
├── apps/
│   ├── web/                    # React frontend
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── api.ts      # REST client (all endpoints)
│   │       │   ├── ws.ts       # WebSocket manager + reconnect queue
│   │       │   ├── crypto.ts   # nacl.box + nacl.secretbox helpers
│   │       │   ├── keyStore.ts # IndexedDB key persistence
│   │       │   └── screenShare.ts # WebRTC peer connections
│   │       ├── store/
│   │       │   └── useStore.ts # Zustand store (auth + nav + WS + crypto)
│   │       ├── screens/
│   │       │   └── AuthScreen.tsx
│   │       └── components/
│   │           ├── ui/         # Tooltip, Skeleton, Avatar, Badge, IconButton
│   │           ├── layout/     # AppLayout, UserPanel, VoiceBar
│   │           ├── servers/    # ServerList
│   │           ├── channels/   # ChannelList, ChannelItem, VoiceChannelItem
│   │           ├── chat/       # ChatArea, ChatHeader, MessageList, MessageGroup, ChatInput
│   │           └── members/    # MemberList
│   └── server/                 # Fastify backend
│       └── src/
│           ├── db/neo4j.ts     # Neo4j driver + query helpers
│           ├── routes/         # auth, servers, channels, messages, keys
│           ├── ws/gateway.ts   # WS rooms + WebRTC signaling
│           └── schema/         # setup.ts (constraints), seed.ts (demo data)
└── package.json                # npm workspaces root
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- A [Neo4j Aura Free](https://neo4j.com/cloud/platform/aura-graph-database/) instance

### 1. Clone and install

```bash
git clone https://github.com/Aldur13/Vira-messaging.git
cd Vira-messaging
npm install
```

### 2. Configure the backend

```bash
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env`:

```env
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=your-username
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=your-database

JWT_SECRET=change-this-to-a-long-random-string
PORT=3001
```

### 3. Set up the database

```bash
# Create constraints and indexes
npm run db:setup --workspace=apps/server

# (Optional) Seed with demo users and messages
npm run db:seed --workspace=apps/server
```

### 4. Run both services

```bash
# Terminal 1 — backend
cd apps/server && npx tsx src/index.ts

# Terminal 2 — frontend
npm run dev --workspace=apps/web
```

Open [http://localhost:5173](http://localhost:5173)

**Demo accounts** (after seeding): `aldur`, `marix`, `zerayn` — password: `password123`

---

## E2E Encryption Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client A                           │
│                                                         │
│  1. Generate X25519 identity key pair (first login)     │
│     └─▶ publicKey uploaded to server                    │
│     └─▶ secretKey stays in IndexedDB forever            │
│                                                         │
│  2. Generate random 32-byte channel key (first send)    │
│     └─▶ Encrypt message: nacl.secretbox(plaintext, key) │
│     └─▶ Seal key for each member: nacl.box(key, pubKey) │
│                                                         │
│  3. WebSocket sends:                                    │
│     { content: "hint", encryptedContent: "base64..." }  │
└──────────────────────────┬──────────────────────────────┘
                           │ WS
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Fastify Server                        │
│                                                         │
│  Stores in Neo4j:                                       │
│  { isEncrypted: true, encryptedContent: "McICoe+…" }    │
│                                                         │
│  Server NEVER sees plaintext ✓                          │
└──────────────────────────┬──────────────────────────────┘
                           │ message:new WS event
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      Client B                           │
│                                                         │
│  Gets channel key from IndexedDB                        │
│  Decrypts: nacl.secretbox.open(ciphertext, key)         │
│  Displays with 🔒 icon                                  │
└─────────────────────────────────────────────────────────┘
```

---

## API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account → JWT |
| POST | `/auth/login` | Login → JWT |
| GET | `/auth/me` | Current user |
| PATCH | `/auth/status` | Update online status |
| POST | `/auth/keys` | Upload identity public key |

### Servers
| Method | Path | Description |
|---|---|---|
| GET | `/servers` | User's servers |
| POST | `/servers` | Create server |
| GET | `/servers/:id/members` | Member list with roles |
| GET | `/servers/:id/channels` | Channel list |
| POST | `/servers/:id/join` | Join server |
| DELETE | `/servers/:id/leave` | Leave server |

### Channels & Messages
| Method | Path | Description |
|---|---|---|
| GET | `/channels/:id/messages` | Paginated messages with author |
| GET | `/channels/:id/member-keys` | Public keys for E2E distribution |
| POST | `/messages/:id/react` | Toggle emoji reaction |
| DELETE | `/messages/:id` | Delete (author or mod) |

### WebSocket (`ws://localhost:3001/ws?token=JWT`)
See [WebSocket Events](../../wiki/WebSocket-Events) in the wiki.

---

## Neo4j Graph Schema

```cypher
// Nodes
(:User { id, username, email, passwordHash, initials, color,
         discriminator, status, publicKey, createdAt })
(:Server { id, name, initials, color, memberCount, createdAt })
(:Channel { id, name, type, description, serverId, createdAt })
(:Message { id, content, encryptedContent, isEncrypted,
             channelId, createdAt })

// Relationships
(User)-[:OWNS]->(Server)
(User)-[:MEMBER_OF { role, joinedAt }]->(Server)
(Server)-[:HAS_CHANNEL]->(Channel)
(User)-[:SENT]->(Message)-[:IN_CHANNEL]->(Channel)
(User)-[:REACTED { emoji, createdAt }]->(Message)
```

---

## Roadmap

- [ ] Signal Protocol double ratchet (forward secrecy)
- [ ] LiveKit SFU integration for large voice rooms (500+)
- [ ] Custom emoji packs + server boosts
- [ ] Profile themes and animated avatar borders
- [ ] Thread replies
- [ ] Mobile app (React Native)
- [ ] File/image attachments (encrypted)
- [ ] Push notifications

---

## License

MIT
