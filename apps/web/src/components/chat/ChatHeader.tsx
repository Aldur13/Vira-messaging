import { useState } from 'react'
import { Hash, Search, Users, Inbox, Layers, Lock, UserPlus } from 'lucide-react'
import clsx from 'clsx'
import { Tooltip } from '../ui/Tooltip'
import InviteModal from '../modals/InviteModal'
import { useStore } from '../../store/useStore'

type Panel = 'threads' | 'search' | 'members' | 'inbox'

const panelButtons: { id: Panel; icon: React.ElementType; label: string }[] = [
  { id: 'threads', icon: Layers, label: 'Threads' },
  { id: 'search',  icon: Search, label: 'Search'  },
  { id: 'members', icon: Users,  label: 'Members' },
  { id: 'inbox',   icon: Inbox,  label: 'Inbox'   },
]

export default function ChatHeader() {
  const channels    = useStore(s => s.channels)
  const selectedId  = useStore(s => s.selectedChannelId)
  const rightPanel  = useStore(s => s.rightPanel)
  const togglePanel = useStore(s => s.togglePanel)
  const [showInvite, setShowInvite] = useState(false)

  const ch = channels.find(c => c.id === selectedId)
  if (!ch) return null

  return (
    <>
      <div className="h-12 flex items-center gap-3 px-4 border-b border-white/6 flex-shrink-0"
           style={{ background: 'var(--color-abyss)' }}>

        {/* Channel name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: 'rgba(6,214,160,0.12)' }}>
            <Hash size={12} strokeWidth={2.5} className="text-brand" />
          </div>
          <span className="text-sm font-700 text-ink-100 truncate">{ch.name}</span>
          {ch.description && (
            <>
              <span className="w-px h-3.5 bg-white/10 flex-shrink-0" />
              <span className="text-[12px] font-400 text-ink-400 truncate hidden lg:block">{ch.description}</span>
            </>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-600 text-brand rounded-full px-2 py-1 mr-2"
               style={{ background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.15)' }}>
            <Lock size={9} strokeWidth={3} />
            Encrypted
          </div>

          {panelButtons.map(({ id, icon: Icon, label }) => (
            <Tooltip key={id} label={label} side="bottom">
              <button
                onClick={() => togglePanel(id)}
                className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer',
                  rightPanel === id
                    ? 'text-brand bg-brand/10'
                    : 'text-ink-400 hover:text-ink-100 hover:bg-raised',
                )}
              >
                <Icon size={15} strokeWidth={1.8} />
              </button>
            </Tooltip>
          ))}

          <div className="w-px h-5 bg-white/8 mx-1" />

          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-700 transition-all cursor-pointer"
            style={{ background: 'rgba(6,214,160,0.12)', color: '#06d6a0', border: '1px solid rgba(6,214,160,0.2)' }}
          >
            <UserPlus size={12} strokeWidth={2} />
            <span className="hidden sm:inline">Invite</span>
          </button>
        </div>
      </div>

      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />
    </>
  )
}
