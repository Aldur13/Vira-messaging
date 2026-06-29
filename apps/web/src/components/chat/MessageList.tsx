import { useEffect, useRef } from 'react'
import { Lock } from 'lucide-react'
import { SkeletonMessage, SkeletonMessageShort } from '../ui/Skeleton'
import MessageGroup from './MessageGroup'
import { useStore } from '../../store/useStore'
import type { Message } from '../../types'

function getMessageDate(timestamp: string): string {
  try {
    const now = new Date()
    const msgDate = new Date(timestamp)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    if (msgDate >= todayStart) return 'Today'
    if (msgDate >= yesterdayStart) return 'Yesterday'

    return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: now.getFullYear() !== msgDate.getFullYear() ? 'numeric' : undefined })
  } catch { return '' }
}

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

  // Group consecutive messages by same author, with date separators
  const groups: ({ type: 'date'; date: string } | { type: 'message'; authorId: string; messages: Message[] })[] = []
  let lastDate = ''

  for (const msg of chMessages) {
    const msgDate = getMessageDate(msg.timestamp)
    if (msgDate && msgDate !== lastDate) {
      groups.push({ type: 'date', date: msgDate })
      lastDate = msgDate
    }

    const last = groups[groups.length - 1]
    if (last?.type === 'message' && last.authorId === msg.authorId) {
      last.messages.push(msg)
    } else {
      groups.push({ type: 'message', authorId: msg.authorId, messages: [msg] })
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
          <div className="flex items-center gap-2 px-2 py-2 mb-2 text-[11px] font-500 text-white/60">
            <Lock size={11} strokeWidth={2} className="text-cyan-400 flex-shrink-0" />
            <span>
              <span className="text-cyan-400 font-600">Vira</span>
              {' '}uses end-to-end encryption — the server stores only ciphertext.
            </span>
          </div>

          {/* Channel welcome */}
          <div className="px-2 mb-4">
            <p className="text-xl font-800 text-white mb-1">Welcome to #{ch?.name}</p>
            {ch?.description && (
              <p className="text-sm font-400 text-white/60">{ch.description}</p>
            )}
          </div>

          {groups.map((group, i) => {
            if (group.type === 'date') {
              return (
                <div key={`date-${i}`} className="flex items-center gap-3 px-3 py-3 my-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[11px] font-600 text-white/40 uppercase">{group.date}</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )
            }

            const memberRec = members.find(m => m.userId === group.authorId)
            const author = memberRec?.user ?? group.messages[0].author
            if (!author) return null
            return <MessageGroup key={i} messages={group.messages} author={author} />
          })}

          {/* Typing indicator */}
          {typing.length > 0 && (
            <div className="px-3 py-1 text-[11px] font-500 text-white/60 italic flex items-center gap-1">
              <span className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-white/50 animate-bounce"
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
