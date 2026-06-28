import { Hash, Pin, Share2 } from 'lucide-react'
import clsx from 'clsx'
import type { Channel } from '../../types'
import { useStore } from '../../store/useStore'

const typeIcon = (type: Channel['type']) => type === 'media' ? Share2 : Hash

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
        'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-500 transition-all duration-150 cursor-pointer text-left group',
        active
          ? 'text-white font-600'
          : 'text-soft hover:text-bright hover:bg-lift/60',
        channel.unreadCount && !active ? 'text-bright font-600' : '',
      )}
      style={active ? { background: 'linear-gradient(135deg,rgba(124,110,245,0.22),rgba(94,234,212,0.10))', borderLeft: '2px solid #7c6ef5' } : undefined}
    >
      <Icon size={14} strokeWidth={active ? 2 : 1.8} className="flex-shrink-0" />
      <span className="flex-1 truncate">{channel.name}</span>
      {!active && channel.unreadCount ? (
        <span className="text-[10px] font-700 rounded-full px-1.5 py-0.5 leading-none flex-shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg,#7c6ef5,#5eead4)' }}>
          {channel.unreadCount}
        </span>
      ) : null}
    </button>
  )
}
