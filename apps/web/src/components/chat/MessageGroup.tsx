import { useState } from 'react'
import clsx from 'clsx'
import { Lock, Edit2, Trash2, Check, X, Reply, MessageCircle, Send } from 'lucide-react'
import type { Message, MessageAuthor } from '../../types'
import { Avatar } from '../ui/Avatar'
import { UserBadge } from '../ui/Badge'
import LinkPreview from './LinkPreview'
import ForwardModal from '../modals/ForwardModal'
import { extractUrls } from '../../lib/linkPreview'
import { useStore } from '../../store/useStore'

interface Props {
  messages: Message[]
  author: MessageAuthor
}

export default function MessageGroup({ messages, author }: Props) {
  const toggleReaction = useStore(s => s.toggleReaction)
  const editMessage    = useStore(s => s.editMessage)
  const deleteMessage  = useStore(s => s.deleteMessage)
  const openThread     = useStore(s => s.openThread)
  const members        = useStore(s => s.members)
  const currentUserId  = useStore(s => s.currentUser?.id)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [forwardingId, setForwardingId] = useState<string | null>(null)

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
      'group flex gap-3 px-3 py-1.5 rounded-2xl transition-colors duration-100 hover:bg-white/5',
      isMe && 'flex-row-reverse',
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        <Avatar user={user} size="md" />
      </div>

      <div className={clsx('flex-1 min-w-0', isMe && 'items-end flex flex-col')}>
        {/* Author row */}
        <div className={clsx('flex items-baseline gap-2 mb-1', isMe && 'flex-row-reverse')}>
          <span className="text-[13px] font-700 text-white">{author.username}</span>
          {user.badges?.map(b => <UserBadge key={b} badge={b} />)}
          <span className="text-[10px] font-400 text-white/50">{messages[0].timestamp}</span>
        </div>

        {/* Messages */}
        {messages.map(msg => {
          const displayText = msg.isEncrypted
            ? (msg.decryptedContent ?? msg.content)
            : msg.content
          const wasDecrypted = msg.isEncrypted && msg.decryptedContent
          const isEditing = editingId === msg.id

          const handleEdit = () => {
            setEditingId(msg.id)
            setEditText(displayText)
          }

          const handleSaveEdit = async () => {
            if (editText.trim()) {
              await editMessage(msg.id, editText.trim())
              setEditingId(null)
            }
          }

          const handleDelete = async () => {
            await deleteMessage(msg.id)
          }

          return (
            <div key={msg.id} className={clsx('mb-1 group', isMe && 'flex flex-col items-end')}>
              <div className="flex items-center gap-2">
                <div className={clsx(
                  'inline-block max-w-sm px-3.5 py-2 rounded-2xl text-[13.5px] font-400 leading-[1.55]',
                  isMe
                    ? 'rounded-tr-sm text-white'
                    : 'rounded-tl-sm bg-high text-soft',
                )}
                  style={isMe ? { background: 'linear-gradient(135deg,#7c6ef5,#5eead4)' } : undefined}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className={clsx(
                        'bg-transparent text-[13.5px] w-full outline-none',
                        isMe ? 'text-white' : 'text-soft',
                      )}
                      autoFocus
                    />
                  ) : (
                    <>
                      {wasDecrypted && (
                        <Lock size={9} className={clsx('inline mr-1 flex-shrink-0', isMe ? 'text-white/70' : 'text-teal')} />
                      )}
                      {displayText}
                      {msg.editedAt && (
                        <span className={clsx('text-[10px] ml-1', isMe ? 'text-white/60' : 'text-ghost')}>
                          (edited)
                        </span>
                      )}
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => openThread(msg.id)}
                      className="p-1.5 hover:bg-high/40 rounded-full transition-colors"
                      title="Reply"
                    >
                      <Reply size={14} className="text-ghost hover:text-teal" />
                    </button>
                    <button
                      onClick={() => setForwardingId(msg.id)}
                      className="p-1.5 hover:bg-high/40 rounded-full transition-colors"
                      title="Forward"
                    >
                      <Send size={14} className="text-ghost hover:text-accent" />
                    </button>
                    {isMe && (
                      <>
                        <button
                          onClick={handleEdit}
                          className="p-1.5 hover:bg-high/40 rounded-full transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} className="text-ghost hover:text-bright" />
                        </button>
                        <button
                          onClick={handleDelete}
                          className="p-1.5 hover:bg-high/40 rounded-full transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} className="text-ghost hover:text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-1">
                    <button
                      onClick={handleSaveEdit}
                      className="p-1.5 hover:bg-teal/20 rounded-full transition-colors"
                      title="Save"
                    >
                      <Check size={14} className="text-teal" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 hover:bg-high/40 rounded-full transition-colors"
                      title="Cancel"
                    >
                      <X size={14} className="text-ghost" />
                    </button>
                  </div>
                )}
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
                          ? 'border-purple-400/40 text-purple-300'
                          : 'bg-white/5 border-white/10 text-white/60 hover:border-purple-400/30',
                      )}
                      style={r.reactedByMe ? { background: 'rgba(192,132,250,0.15)' } : undefined}
                    >
                      {r.emoji} <span>{r.count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Link previews */}
              {(() => {
                const urls = extractUrls(displayText)
                return urls.length > 0 ? (
                  <div className={clsx(isMe && 'flex justify-end')}>
                    {urls.map(url => (
                      <LinkPreview key={url} url={url} />
                    ))}
                  </div>
                ) : null
              })()}

              {/* Thread indicator */}
              {msg.replyCount ? (
                <button
                  onClick={() => openThread(msg.id)}
                  className={clsx('text-[11px] font-600 text-purple-300 hover:text-cyan-300 mt-1.5 flex items-center gap-1 transition-colors', isMe && 'justify-end')}
                >
                  <MessageCircle size={12} />
                  {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      <ForwardModal open={!!forwardingId} messageId={forwardingId} onClose={() => setForwardingId(null)} />
    </div>
  )
}
