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
  const toggleReaction = useStore(s => s.toggleReaction)
  const members        = useStore(s => s.members)
  const currentUserId  = useStore(s => s.currentUser?.id)

  const memberRec = members.find(m => m.userId === author.id)
  const user = {
    id:            author.id,
    username:      author.username,
    initials:      author.initials,
    color:         author.color,
    discriminator: memberRec?.user.discriminator ?? '0000',
    status:        memberRec?.user.status ?? ('online' as const),
    badges:        memberRec?.user.badges,
  }

  const isMe = author.id === currentUserId

  return (
    <div className={clsx(
      'group flex gap-3 px-3 py-1.5 rounded-2xl transition-colors duration-100 hover:bg-lift/40',
      isMe && 'flex-row-reverse',
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        <Avatar user={user} size="md" />
      </div>

      <div className={clsx('flex-1 min-w-0', isMe && 'items-end flex flex-col')}>
        {/* Author row */}
        <div className={clsx('flex items-baseline gap-2 mb-1', isMe && 'flex-row-reverse')}>
          <span className="text-[13px] font-700 text-bright">{author.username}</span>
          {user.badges?.map(b => <UserBadge key={b} badge={b} />)}
          <span className="text-[10px] font-400 text-ghost">{messages[0].timestamp}</span>
        </div>

        {/* Messages */}
        {messages.map(msg => {
          const displayText = msg.isEncrypted
            ? (msg.decryptedContent ?? msg.content)
            : msg.content
          const wasDecrypted = msg.isEncrypted && msg.decryptedContent

          return (
            <div key={msg.id} className={clsx('mb-1', isMe && 'flex flex-col items-end')}>
              <div className={clsx(
                'inline-block max-w-sm px-3.5 py-2 rounded-2xl text-[13.5px] font-400 leading-[1.55]',
                isMe
                  ? 'rounded-tr-sm text-white'
                  : 'rounded-tl-sm bg-high text-soft',
              )}
                style={isMe ? { background: 'linear-gradient(135deg,#7c6ef5,#5eead4)' } : undefined}
              >
                {wasDecrypted && (
                  <Lock size={9} className={clsx('inline mr-1 flex-shrink-0', isMe ? 'text-white/70' : 'text-teal')} />
                )}
                {displayText}
              </div>

              {/* Reactions */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div className={clsx('flex flex-wrap gap-1 mt-1.5', isMe && 'justify-end')}>
                  {msg.reactions.map(r => (
                    <button
                      key={r.emoji}
                      onClick={() => toggleReaction(msg.id, r.emoji)}
                      className={clsx(
                        'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-600 transition-all duration-150 cursor-pointer',
                        r.reactedByMe
                          ? 'border-accent/40 text-accent'
                          : 'bg-high border-white/8 text-soft hover:border-accent/30',
                      )}
                      style={r.reactedByMe ? { background: 'rgba(124,110,245,0.15)' } : undefined}
                    >
                      {r.emoji} <span>{r.count}</span>
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
