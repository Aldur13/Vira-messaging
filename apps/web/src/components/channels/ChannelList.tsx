import { useState } from 'react'
import { Plus, Hash, Mic, Tv2, ArrowLeft, Lock } from 'lucide-react'
import clsx from 'clsx'
import { Tooltip } from '../ui/Tooltip'
import { SkeletonChannel } from '../ui/Skeleton'
import { Avatar } from '../ui/Avatar'
import VoiceBar from '../layout/VoiceBar'
import UserPanel from '../layout/UserPanel'
import CreateRoomModal from '../modals/CreateRoomModal'
import { useStore } from '../../store/useStore'
import type { Channel } from '../../types'

function typeIcon(type: Channel['type']) {
  if (type === 'voice') return Mic
  if (type === 'stage') return Tv2
  return Hash
}

export default function ChannelList() {
  const servers       = useStore(s => s.servers)
  const channels      = useStore(s => s.channels)
  const selectedSrvId = useStore(s => s.selectedServerId)
  const selectedChId  = useStore(s => s.selectedChannelId)
  const activeVoiceId = useStore(s => s.activeVoiceChannelId)
  const members       = useStore(s => s.members)
  const isLoading     = useStore(s => s.isLoading)
  const selectChannel = useStore(s => s.selectChannel)
  const selectServer  = useStore(s => s.selectServer)

  const [showCreate, setShowCreate] = useState(false)

  const server  = servers.find(s => s.id === selectedSrvId)
  const textChs = channels.filter(c => c.type === 'text' || c.type === 'media')
  const voChs   = channels.filter(c => c.type === 'voice' || c.type === 'stage')

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-white/6" style={{ background: 'var(--color-deep)' }}>
      {/* Space header */}
      <div className="px-3 py-3 border-b border-white/6 flex-shrink-0">
        <button onClick={() => selectServer('')}
                className="flex items-center gap-1.5 text-ink-400 hover:text-brand text-[11px] font-600 cursor-pointer transition-colors mb-2">
          <ArrowLeft size={11} strokeWidth={2.5} />
          All Spaces
        </button>
        <p className="text-sm font-700 text-ink-100 truncate">{server?.name}</p>
        <div className="flex items-center gap-1 mt-1 text-[10px] font-600 text-brand">
          <Lock size={9} strokeWidth={3} />
          End-to-End Encrypted
        </div>
      </div>

      {/* Rooms */}
      <div className="flex-1 overflow-y-auto py-2">

        {/* Text rooms */}
        <div className="px-2 mb-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[10px] font-700 uppercase tracking-[0.8px] text-ink-600">Rooms</span>
            <Tooltip label="Add Room" side="right">
              <button onClick={() => setShowCreate(true)}
                      className="text-ink-400 hover:text-brand cursor-pointer transition-colors">
                <Plus size={13} strokeWidth={2.5} />
              </button>
            </Tooltip>
          </div>

          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonChannel key={i} />)
            : textChs.map(ch => {
                const active = ch.id === selectedChId
                const Icon = typeIcon(ch.type)
                return (
                  <button key={ch.id} onClick={() => selectChannel(ch.id)}
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-500 transition-all duration-150 cursor-pointer text-left group mb-0.5',
                      active ? 'text-brand font-600' : 'text-ink-400 hover:text-ink-100 hover:bg-raised',
                    )}
                    style={active ? { background: 'rgba(6,214,160,0.1)' } : undefined}
                  >
                    <Icon size={14} strokeWidth={active ? 2 : 1.7} className="flex-shrink-0" />
                    <span className="flex-1 truncate">{ch.name}</span>
                    {!active && ch.unreadCount ? (
                      <span className="text-[10px] font-700 text-white rounded-full px-1.5 py-0.5"
                            style={{ background: 'var(--color-brand)' }}>
                        {ch.unreadCount}
                      </span>
                    ) : null}
                  </button>
                )
              })
          }
        </div>

        {/* Voice rooms */}
        {voChs.length > 0 && (
          <div className="px-2 mt-2">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-[10px] font-700 uppercase tracking-[0.8px] text-ink-600">Voice</span>
            </div>
            {voChs.map(ch => {
              const active = ch.id === activeVoiceId
              const Icon = typeIcon(ch.type)
              return (
                <div key={ch.id}>
                  <button onClick={() => selectChannel(ch.id)}
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-500 transition-all cursor-pointer text-left mb-0.5',
                      active ? 'text-online font-600' : 'text-ink-400 hover:text-ink-100 hover:bg-raised',
                    )}
                  >
                    <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', active ? 'bg-online' : 'bg-ink-600')} />
                    <Icon size={13} strokeWidth={1.7} className="flex-shrink-0" />
                    <span className="flex-1 truncate">{ch.name}</span>
                  </button>
                  {/* Show active voice members */}
                  {active && members.slice(0,3).map(m => (
                    <div key={m.userId} className="flex items-center gap-2 pl-8 pr-3 py-0.5">
                      <Avatar user={m.user} size="xs" showStatus />
                      <span className="text-[11px] text-ink-400 truncate">{m.user.username}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <VoiceBar />
      <UserPanel />

      <CreateRoomModal open={showCreate} onClose={() => setShowCreate(false)} />
    </aside>
  )
}
