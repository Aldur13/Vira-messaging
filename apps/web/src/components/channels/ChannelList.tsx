import { ChevronDown, Plus, Lock } from 'lucide-react'
import { Tooltip } from '../ui/Tooltip'
import { SkeletonChannel } from '../ui/Skeleton'
import ChannelItem from './ChannelItem'
import VoiceChannelItem from './VoiceChannelItem'
import VoiceBar from '../layout/VoiceBar'
import UserPanel from '../layout/UserPanel'
import { useStore } from '../../store/useStore'

export default function ChannelList() {
  const servers       = useStore(s => s.servers)
  const channels      = useStore(s => s.channels)
  const selectedSrvId = useStore(s => s.selectedServerId)
  const isLoading     = useStore(s => s.isLoading)

  const server  = servers.find(s => s.id === selectedSrvId)
  const textChs  = channels.filter(c => c.type === 'text' || c.type === 'media')
  const voiceChs = channels.filter(c => c.type === 'voice' || c.type === 'stage')

  return (
    <div className="w-60 flex-shrink-0 flex flex-col glass border-r border-white/6">

      {/* Server header */}
      <button className="flex items-center justify-between px-4 py-4 border-b border-white/6 hover:bg-white/4 transition-colors duration-150 cursor-pointer flex-shrink-0">
        <span className="text-sm font-700 text-bright truncate">{server?.name ?? '…'}</span>
        <ChevronDown size={14} strokeWidth={2.5} className="text-ghost flex-shrink-0" />
      </button>

      {/* E2E pill */}
      <div className="px-3 py-2.5 border-b border-white/6 flex-shrink-0">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-600 text-teal rounded-full px-2.5 py-1"
             style={{ background: 'rgba(94,234,212,0.1)', border: '1px solid rgba(94,234,212,0.2)' }}>
          <Lock size={9} strokeWidth={3} />
          End-to-End Encrypted
        </div>
      </div>

      {/* Scrollable channels */}
      <div className="flex-1 overflow-y-auto py-2">

        {/* Text */}
        <div className="px-2 mb-1">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[10px] font-700 uppercase tracking-[0.8px] text-ghost">Text Channels</span>
            <Tooltip label="Create Channel" side="top">
              <button className="text-ghost hover:text-teal cursor-pointer transition-colors">
                <Plus size={13} strokeWidth={2.5} />
              </button>
            </Tooltip>
          </div>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonChannel key={i} />)
            : textChs.map(ch => <ChannelItem key={ch.id} channel={ch} />)
          }
        </div>

        {/* Voice */}
        <div className="px-2 mt-3">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[10px] font-700 uppercase tracking-[0.8px] text-ghost">Voice Channels</span>
            <Tooltip label="Create Channel" side="top">
              <button className="text-ghost hover:text-teal cursor-pointer transition-colors">
                <Plus size={13} strokeWidth={2.5} />
              </button>
            </Tooltip>
          </div>
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => <SkeletonChannel key={i} />)
            : voiceChs.map(ch => <VoiceChannelItem key={ch.id} channel={ch} />)
          }
        </div>
      </div>

      <VoiceBar />
      <UserPanel />
    </div>
  )
}
