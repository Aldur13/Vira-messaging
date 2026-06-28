import { Hash, Search, Users, Inbox, Layers } from 'lucide-react'
import { Lock } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { useStore } from '../../store/useStore'

export default function ChatHeader() {
  const channels   = useStore(s => s.channels)
  const selectedId = useStore(s => s.selectedChannelId)

  const ch = channels.find(c => c.id === selectedId)
  if (!ch) return null

  return (
    <div className="flex items-center gap-2 px-4 h-14 border-b border-white/5 bg-mid flex-shrink-0">
      <Hash size={16} strokeWidth={2} className="text-ghost flex-shrink-0" />
      <span className="text-[15px] font-700 text-bright">{ch.name}</span>
      {ch.description && (
        <>
          <span className="w-px h-4 bg-white/10 mx-1 flex-shrink-0" />
          <span className="text-[12px] font-500 text-ghost truncate hidden sm:block">{ch.description}</span>
        </>
      )}

      <div className="flex items-center gap-1 ml-auto">
        <div className="flex items-center gap-1.5 text-teal bg-teal/8 border border-teal/15 rounded-full px-2.5 py-1 text-[10px] font-600 mr-2 flex-shrink-0">
          <Lock size={9} strokeWidth={3} />
          E2E Encrypted
        </div>
        <IconButton icon={Layers}  label="Threads"        side="bottom" />
        <IconButton icon={Search}  label="Search channel" side="bottom" />
        <IconButton icon={Users}   label="Member list"    side="bottom" />
        <IconButton icon={Inbox}   label="Inbox"          side="bottom" />
      </div>
    </div>
  )
}
