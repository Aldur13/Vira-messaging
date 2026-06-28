import clsx from 'clsx'
import { Lock } from 'lucide-react'
import type { Message, MessageAuthor } from '../../types'
import { Avatar } from '../ui/Avatar'
import { UserBadge } from '../ui/Badge'
import { useStore } from '../../store/useStore'

interface Props {
  messages: Message[]
  author: MessageAuthor
}

export default function MessageGroup({ messages, author }: Props) {
  const toggleReaction  = useStore(s => s.toggleReaction)
  const members         = useStore(s => s.members)

  // Build a User-compatible object for Avatar
  const memberRec = members.find(m => m.userId === author.id)
  const user = {
    id:            author.id,
    username:      author.username,
    initials:      author.initials,
    color:         author.color,
    discriminator: memberRec?.user.discriminator ?? '0000',
    status:        memberRec?.user.status ?? 'online',
    badges:        memberRec?.user.badges,
  }

  return (
    <div className="group flex gap-3 px-2 py-1 rounded-xl hover:bg-lift/60 transition-colors duration-100">
      <div className="flex-shrink-0 pt-0.5">
        <Avatar user={user} size="md" />
      </div>
      <div className="flex-1 min-w-0">
        {/* Author line — only on first message */}
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[13px] font-700 text-bright">{author.username}</span>
          {user.badges?.map(b => <UserBadge key={b} badge={b} />)}
          <span className="text-[10px] font-400 text-ghost">{messages[0].timestamp}</span>
        </div>

        {messages.map(msg => {
          // Show decrypted content if available, fall back to plaintext, then show lock icon
          const displayText = msg.isEncrypted
            ? (msg.decryptedContent ?? msg.content)
            : msg.content

          const wasDecrypted = msg.isEncrypted && msg.decryptedContent

          return (
            <div key={msg.id} className="mb-0.5">
              <p className="text-[13.5px] font-400 text-soft leading-[1.55] flex items-start gap-1.5">
                {wasDecrypted && (
                  <Lock size={10} className="text-teal flex-shrink-0 mt-1" />
                )}
                {displayText}
              </p>

              {/* Reactions */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {msg.reactions.map(r => (
                    <button
                      key={r.emoji}
                      onClick={() => toggleReaction(msg.id, r.emoji)}
                      className={clsx(
                        'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-600 transition-all duration-150 cursor-pointer',
                        r.reactedByMe
                          ? 'bg-accent/15 border-accent/40 text-accent'
                          : 'bg-high border-white/8 text-soft hover:border-accent/40 hover:bg-accent/10',
                      )}
                    >
                      {r.emoji}
                      <span>{r.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
