import { Plus, Compass } from 'lucide-react'
import clsx from 'clsx'
import { ViraLogo } from '../ui/ViraLogo'
import { Tooltip } from '../ui/Tooltip'
import { useStore } from '../../store/useStore'

export default function ServerList() {
  const servers      = useStore(s => s.servers)
  const selectedId   = useStore(s => s.selectedServerId)
  const selectServer = useStore(s => s.selectServer)

  return (
    <nav className="w-[68px] flex-shrink-0 flex flex-col items-center gap-2 py-3 bg-deep border-r border-white/5 overflow-y-auto">

      {/* Vira brand mark at top */}
      <div className="mb-1 flex-shrink-0">
        <Tooltip label="Vira" side="right">
          <div className="w-11 h-11 flex items-center justify-center">
            <ViraLogo size={36} />
          </div>
        </Tooltip>
      </div>

      <div className="w-8 h-px bg-white/8 flex-shrink-0" />

      {/* Server icons — hexagonal */}
      {servers.map(srv => {
        const active = srv.id === selectedId
        return (
          <Tooltip key={srv.id} label={srv.name} side="right">
            <button
              onClick={() => selectServer(srv.id)}
              className={clsx(
                'relative w-11 h-11 flex items-center justify-center flex-shrink-0',
                'text-[13px] font-700 text-white transition-all duration-200 cursor-pointer select-none',
                'hex-clip',
                active ? 'scale-105' : 'opacity-70 hover:opacity-100 hover:scale-105',
              )}
              style={{
                background: active
                  ? 'linear-gradient(135deg,#7c6ef5,#5eead4)'
                  : (srv.color ?? 'linear-gradient(135deg,#1a2030,#202638)'),
                boxShadow: active ? '0 0 22px rgba(124,110,245,0.45)' : undefined,
              }}
            >
              {srv.initials}
              {/* Active pulse ring */}
              {active && (
                <span className="absolute inset-0 hex-clip animate-pulse"
                      style={{ background: 'linear-gradient(135deg,rgba(124,110,245,0.2),rgba(94,234,212,0.2))' }} />
              )}
            </button>
          </Tooltip>
        )
      })}

      <div className="w-8 h-px bg-white/8 my-0.5 flex-shrink-0" />

      <Tooltip label="Add a Server" side="right">
        <button className="w-11 h-11 hex-clip flex items-center justify-center text-teal bg-high hover:bg-teal hover:text-deep transition-all duration-200 flex-shrink-0 cursor-pointer"
                style={{ transitionProperty: 'background,color,box-shadow' }}>
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </Tooltip>

      <div className="mt-auto flex-shrink-0 pb-1">
        <Tooltip label="Explore Servers" side="right">
          <button className="w-11 h-11 hex-clip flex items-center justify-center text-ghost bg-high hover:text-soft hover:bg-lift transition-all duration-200 cursor-pointer">
            <Compass size={18} strokeWidth={1.8} />
          </button>
        </Tooltip>
      </div>
    </nav>
  )
}
