import { Hash, Pin, Share2 } from 'lucide-react'
import clsx from 'clsx'
import type { Channel } from '../../types'
import { useStore } from '../../store/useStore'

const typeIcon = (type: Channel['type']) => {
  if (type === 'media') return Share2
  return Hash
}

interface Props { channel: Channel }

export default function ChannelItem({ channel }: Props) {
  const selectedId    = useStore(s => s.selectedChannelId)
  const selectChannel = useStore(s => s.selectChannel)
  const active = channel.id === selectedId
  const Icon = channel.name === 'welcome' ? Pin : typeIcon(channel.type)

  return (
    <button
      onClick={() => selectChannel(channel.id)}
      className={clsx(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-500 transition-all duration-150 cursor-pointer text-left group',
        active
          ? 'bg-high text-bright'
          : 'text-soft hover:bg-lift hover:text-bright',
        channel.unreadCount && !active ? 'text-bright font-600' : '',
      )}
    >
      <Icon size={14} strokeWidth={1.8} className="flex-shrink-0" />
      <span className="flex-1 truncate">{channel.name}</span>
      {!active && channel.unreadCount ? (
        <span className="text-[10px] font-700 bg-accent text-white rounded-full px-1.5 py-0.5 leading-none flex-shrink-0">
          {channel.unreadCount}
        </span>
      ) : null}
    </button>
  )
}
