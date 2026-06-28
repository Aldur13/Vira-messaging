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

  const server = servers.find(s => s.id === selectedSrvId)
  const textChs  = channels.filter(c => c.type === 'text' || c.type === 'media')
  const voiceChs = channels.filter(c => c.type === 'voice' || c.type === 'stage')

  return (
    <div className="w-56 flex-shrink-0 flex flex-col bg-dark border-r border-white/5">
      {/* Server header */}
      <button className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 hover:bg-lift transition-colors duration-150 cursor-pointer flex-shrink-0">
        <span className="text-sm font-700 text-bright truncate">{server?.name ?? 'Loading…'}</span>
        <ChevronDown size={15} strokeWidth={2.5} className="text-ghost flex-shrink-0" />
      </button>

      {/* E2E badge */}
      <div className="px-3 py-2 border-b border-white/5 flex-shrink-0">
        <div className="inline-flex items-center gap-1.5 text-teal bg-teal/8 border border-teal/20 rounded-full px-2.5 py-1 text-[10px] font-600">
          <Lock size={9} strokeWidth={3} />
          End-to-End Encrypted
        </div>
      </div>

      {/* Scrollable channels */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Text channels */}
        <div className="px-2 mb-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-700 uppercase tracking-[0.7px] text-ghost">Text Channels</span>
            <Tooltip label="Create Channel" side="top">
              <button className="text-ghost hover:text-soft cursor-pointer transition-colors">
                <Plus size={13} strokeWidth={2.5} />
              </button>
            </Tooltip>
          </div>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonChannel key={i} />)
            : textChs.map(ch => <ChannelItem key={ch.id} channel={ch} />)
          }
        </div>

        {/* Voice channels */}
        <div className="px-2 mt-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-700 uppercase tracking-[0.7px] text-ghost">Voice Channels</span>
            <Tooltip label="Create Channel" side="top">
              <button className="text-ghost hover:text-soft cursor-pointer transition-colors">
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
