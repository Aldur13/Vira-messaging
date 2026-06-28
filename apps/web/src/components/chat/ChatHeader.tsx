import { Hash, Search, Users, Inbox, Layers, Lock } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { useStore } from '../../store/useStore'

export default function ChatHeader() {
  const channels   = useStore(s => s.channels)
  const selectedId = useStore(s => s.selectedChannelId)

  const ch = channels.find(c => c.id === selectedId)
  if (!ch) return null

  return (
    <div className="flex items-center gap-3 px-5 h-14 border-b border-white/6 bg-mid flex-shrink-0">
      {/* Channel name with pill */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-high flex items-center justify-center flex-shrink-0">
          <Hash size={13} strokeWidth={2} className="text-accent" />
        </div>
        <span className="text-[14px] font-700 text-bright truncate">{ch.name}</span>
        {ch.description && (
          <>
            <span className="w-px h-4 bg-white/10 flex-shrink-0" />
            <span className="text-[12px] font-400 text-ghost truncate hidden lg:block">{ch.description}</span>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* E2E badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-600 text-teal rounded-full px-2.5 py-1 mr-1"
             style={{ background: 'rgba(94,234,212,0.1)', border: '1px solid rgba(94,234,212,0.15)' }}>
          <Lock size={9} strokeWidth={3} />
          Encrypted
        </div>
        <IconButton icon={Layers}  label="Threads"  side="bottom" />
        <IconButton icon={Search}  label="Search"   side="bottom" />
        <IconButton icon={Users}   label="Members"  side="bottom" />
        <IconButton icon={Inbox}   label="Inbox"    side="bottom" />
      </div>
    </div>
  )
}
