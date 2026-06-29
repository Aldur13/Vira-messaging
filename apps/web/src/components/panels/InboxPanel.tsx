import { Bell } from 'lucide-react'
import { useStore } from '../../store/useStore'

export default function InboxPanel() {
  const messages = useStore(s => s.messages)
  const currentUserId = useStore(s => s.currentUser?.id)
  const members = useStore(s => s.members)

  // Find messages that mention the current user
  const username = useStore(s => s.currentUser?.username ?? '')
  const mentions = messages.filter(m =>
    m.authorId !== currentUserId &&
    (m.decryptedContent ?? m.content)?.toLowerCase().includes(`@${username.toLowerCase()}`)
  ).slice(-20).reverse()

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-deep)' }}>
      <div className="px-4 py-3 border-b border-white/6 flex-shrink-0">
        <p className="text-xs font-700 text-ink-100">Inbox</p>
        <p className="text-[10px] text-ink-400 mt-0.5">Mentions and notifications</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {mentions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-raised)' }}>
              <Bell size={20} className="text-ink-400" />
            </div>
            <p className="text-xs font-600 text-ink-400 text-center">You're all caught up!</p>
            <p className="text-[11px] text-ink-600 text-center">Mentions and replies will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-600 text-ink-400 uppercase tracking-wider mb-3">{mentions.length} mention{mentions.length !== 1 ? 's' : ''}</p>
            {mentions.map(msg => {
              const member = members.find(m => m.userId === msg.authorId)
              const displayText = msg.decryptedContent ?? msg.content
              return (
                <div key={msg.id} className="p-3 bg-raised rounded-xl border border-white/6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-600 text-ink-100">{member?.user.username ?? 'Unknown'}</span>
                    <span className="text-[10px] text-ink-600">{msg.timestamp}</span>
                  </div>
                  <p className="text-xs text-ink-400">{displayText}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
