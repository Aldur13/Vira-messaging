import { useEffect, useRef } from 'react'
import { Lock } from 'lucide-react'
import { SkeletonMessage, SkeletonMessageShort } from '../ui/Skeleton'
import MessageGroup from './MessageGroup'
import { useStore } from '../../store/useStore'
import type { Message } from '../../types'

export default function MessageList() {
  const messages         = useStore(s => s.messages)
  const channels         = useStore(s => s.channels)
  const members          = useStore(s => s.members)
  const selectedId       = useStore(s => s.selectedChannelId)
  const isLoadingMsgs    = useStore(s => s.isLoadingMessages)
  const typingUsers      = useStore(s => s.typingUsers)
  const bottomRef        = useRef<HTMLDivElement>(null)

  const chMessages = messages.filter(m => m.channelId === selectedId)
  const ch         = channels.find(c => c.id === selectedId)
  const typing     = selectedId ? (typingUsers[selectedId] ?? []) : []

  // Group consecutive messages by same author
  const groups: { authorId: string; messages: Message[] }[] = []
  for (const msg of chMessages) {
    const last = groups[groups.length - 1]
    if (last && last.authorId === msg.authorId) {
      last.messages.push(msg)
    } else {
      groups.push({ authorId: msg.authorId, messages: [msg] })
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chMessages.length, selectedId])

  return (
    <div className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-0.5">
      {isLoadingMsgs ? (
        <>
          <SkeletonMessage />
          <SkeletonMessageShort />
          <SkeletonMessage />
          <SkeletonMessage />
          <SkeletonMessageShort />
        </>
      ) : (
        <>
          {/* E2E notice */}
          <div className="flex items-center gap-2 px-2 py-2 mb-2 text-[11px] font-500 text-ghost">
            <Lock size={11} strokeWidth={2} className="text-teal flex-shrink-0" />
            <span>
              <span className="text-teal font-600">Vira</span>
              {' '}uses end-to-end encryption — the server stores only ciphertext.
            </span>
          </div>

          {/* Channel welcome */}
          <div className="px-2 mb-4">
            <p className="text-xl font-800 text-bright mb-1">Welcome to #{ch?.name}</p>
            {ch?.description && (
              <p className="text-sm font-400 text-ghost">{ch.description}</p>
            )}
          </div>

          {groups.map((group, i) => {
            // Find author from members list or from embedded message author
            const memberRec = members.find(m => m.userId === group.authorId)
            const author = memberRec?.user ?? group.messages[0].author
            if (!author) return null
            return <MessageGroup key={i} messages={group.messages} author={author} />
          })}

          {/* Typing indicator */}
          {typing.length > 0 && (
            <div className="px-3 py-1 text-[11px] font-500 text-ghost italic flex items-center gap-1">
              <span className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-ghost animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
              {typing.map(t => t.username).join(', ')} {typing.length === 1 ? 'is' : 'are'} typing…
            </div>
          )}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
