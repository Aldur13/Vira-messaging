import { Mic, Tv2 } from 'lucide-react'
import clsx from 'clsx'
import type { Channel } from '../../types'
import { useStore } from '../../store/useStore'

interface Props { channel: Channel }

export default function VoiceChannelItem({ channel }: Props) {
  const activeId  = useStore(s => s.activeVoiceChannelId)
  const joinVoice = useStore(s => s.joinVoiceChannel)
  const isActive  = channel.id === activeId
  const Icon = channel.type === 'stage' ? Tv2 : Mic

  return (
    <div className="mb-0.5">
      <button
        onClick={() => joinVoice(channel.id)}
        className={clsx(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-500 transition-all duration-150 cursor-pointer text-left',
          isActive ? 'text-online' : 'text-soft hover:bg-lift hover:text-bright',
        )}
      >
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors',
          isActive ? 'bg-online' : 'bg-ghost',
        )} />
        <Icon size={14} strokeWidth={1.8} className="flex-shrink-0" />
        <span className="flex-1 truncate">{channel.name}</span>
        {isActive && (
          <Mic size={11} className="text-online flex-shrink-0" />
        )}
      </button>
    </div>
  )
}
