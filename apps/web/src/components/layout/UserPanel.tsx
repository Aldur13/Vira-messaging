import { useState } from 'react'
import { Mic, MicOff, Headphones, EarOff, Settings } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { IconButton } from '../ui/IconButton'
import SettingsModal from '../modals/SettingsModal'
import { useStore } from '../../store/useStore'
import type { User } from '../../types'

export default function UserPanel() {
  const currentUser  = useStore(s => s.currentUser)
  const isMuted      = useStore(s => s.isMuted)
  const isDeafened   = useStore(s => s.isDeafened)
  const toggleMute   = useStore(s => s.toggleMute)
  const toggleDeafen = useStore(s => s.toggleDeafen)
  const [showSettings, setShowSettings] = useState(false)

  if (!currentUser) return null

  const user: User = {
    id:            currentUser.id,
    username:      currentUser.username,
    initials:      currentUser.initials,
    color:         currentUser.color,
    discriminator: currentUser.discriminator,
    status:        (currentUser.status as User['status']) ?? 'online',
  }

  return (
    <>
      <div className="flex items-center gap-2 px-2 py-2 border-t border-white/6 flex-shrink-0"
           style={{ background: 'var(--color-abyss)' }}>
        <Avatar user={user} size="sm" showStatus />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-700 text-ink-100 truncate">{user.username}</p>
          <p className="text-[10px] font-500 text-ink-400 truncate">#{user.discriminator}</p>
        </div>
        <div className="flex items-center gap-0.5">
          <IconButton icon={isMuted    ? MicOff  : Mic}        label={isMuted    ? 'Unmute'   : 'Mute'}   onClick={toggleMute}              active={isMuted}    size={14} />
          <IconButton icon={isDeafened ? EarOff  : Headphones}  label={isDeafened ? 'Undeafen' : 'Deafen'} onClick={toggleDeafen}            active={isDeafened} size={14} />
          <IconButton icon={Settings}                            label="Settings"                            onClick={() => setShowSettings(true)}               size={14} />
        </div>
      </div>
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
