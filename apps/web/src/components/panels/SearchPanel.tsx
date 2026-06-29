import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { useStore } from '../../store/useStore'

export default function SearchPanel() {
  const [query, setQuery] = useState('')
  const messages = useStore(s => s.messages)
  const members  = useStore(s => s.members)
  const selectedChannelId = useStore(s => s.selectedChannelId)
  const selectChannel = useStore(s => s.selectChannel)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return messages
      .filter(m => m.channelId === selectedChannelId && (
        (m.decryptedContent ?? m.content)?.toLowerCase().includes(q)
      ))
      .slice(-30)
      .reverse()
  }, [query, messages, selectedChannelId])

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-deep)' }}>
      <div className="p-3 border-b border-white/6 flex-shrink-0">
        <div className="flex items-center gap-2 bg-raised rounded-xl px-3 py-2 border border-white/8 focus-within:border-brand/40 transition-colors">
          <Search size={14} className="text-ink-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search this room…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-400 text-ink-100 placeholder:text-ink-600 outline-none caret-brand"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!query.trim() ? (
          <p className="text-xs text-ink-600 text-center py-8">Start typing to search messages</p>
        ) : results.length === 0 ? (
          <p className="text-xs text-ink-600 text-center py-8">No messages found for "{query}"</p>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-600 text-ink-400 uppercase tracking-wider mb-3">{results.length} result{results.length !== 1 ? 's' : ''}</p>
            {results.map(msg => {
              const member = members.find(m => m.userId === msg.authorId)
              const author = member?.user ?? msg.author
              if (!author) return null
              const displayText = msg.decryptedContent ?? msg.content
              const q = query.trim()
              const idx = displayText?.toLowerCase().indexOf(q.toLowerCase()) ?? -1
              return (
                <div key={msg.id} className="p-3 bg-raised rounded-xl border border-white/6 hover:border-brand/20 cursor-pointer transition-colors"
                     onClick={() => selectChannel(msg.channelId)}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {author && <Avatar user={author} size="xs" />}
                    <span className="text-xs font-600 text-ink-100">{author?.username}</span>
                    <span className="text-[10px] text-ink-600">{msg.timestamp}</span>
                  </div>
                  <p className="text-xs text-ink-400 leading-relaxed">
                    {idx >= 0 ? (
                      <>
                        {displayText?.slice(0, idx)}
                        <mark className="bg-brand/25 text-brand rounded px-0.5">{displayText?.slice(idx, idx + q.length)}</mark>
                        {displayText?.slice(idx + q.length)}
                      </>
                    ) : displayText}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
