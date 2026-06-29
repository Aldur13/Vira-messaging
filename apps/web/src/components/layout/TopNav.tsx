import { useState } from 'react'
import { Settings, LogOut } from 'lucide-react'
import { ViraLogo } from '../ui/ViraLogo'
import { Avatar } from '../ui/Avatar'
import { Tooltip } from '../ui/Tooltip'
import SettingsModal from '../modals/SettingsModal'
import { useStore } from '../../store/useStore'
import type { User } from '../../types'

export default function TopNav() {
  const currentUser      = useStore(s => s.currentUser)
  const selectedServerId = useStore(s => s.selectedServerId)
  const selectedChId     = useStore(s => s.selectedChannelId)
  const servers          = useStore(s => s.servers)
  const channels         = useStore(s => s.channels)
  const logout           = useStore(s => s.logout)
  const selectServer     = useStore(s => s.selectServer)
  const rightPanel       = useStore(s => s.rightPanel)

  const [showSettings, setShowSettings] = useState(false)

  const server  = servers.find(s => s.id === selectedServerId)
  const channel = channels.find(c => c.id === selectedChId)

  const user: User | null = currentUser ? {
    id: currentUser.id, username: currentUser.username,
    initials: currentUser.initials, color: currentUser.color,
    discriminator: currentUser.discriminator,
    status: (currentUser.status as User['status']) ?? 'online',
  } : null

  return (
    <>
      <header className="h-11 flex-shrink-0 flex items-center px-4 gap-3 border-b border-white/10 backdrop-blur-xl" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
        {/* Logo — clicking goes home */}
        <button onClick={() => selectServer('')} className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
          <ViraLogo size={26} />
          <span className="text-sm font-800 text-white group-hover:text-blue-300 transition-colors">Vira</span>
        </button>

        {/* Breadcrumb when in space */}
        {server && (
          <div className="flex items-center gap-1.5 text-xs font-500 text-white/60">
            <span className="text-white/30">/</span>
            <span className="text-white/90 font-600">{server.name}</span>
            {channel && (
              <>
                <span className="text-white/30">/</span>
                <span className="text-blue-300 font-600">#{channel.name}</span>
              </>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* Panel status indicator */}
        {rightPanel && (
          <span className="text-[10px] font-600 text-white/50 capitalize hidden sm:block">
            {rightPanel} open
          </span>
        )}

        <div className="flex items-center gap-1">
          <Tooltip label="Settings" side="bottom">
            <button
              onClick={() => setShowSettings(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              <Settings size={14} strokeWidth={1.8} />
            </button>
          </Tooltip>
          <Tooltip label="Sign out" side="bottom">
            <button onClick={logout} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer">
              <LogOut size={14} strokeWidth={1.8} />
            </button>
          </Tooltip>
          {user && <div className="ml-1"><Avatar user={user} size="xs" showStatus /></div>}
        </div>
      </header>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
