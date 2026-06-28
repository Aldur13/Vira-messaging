import { Plus, Compass } from 'lucide-react'
import clsx from 'clsx'
import { Tooltip } from '../ui/Tooltip'
import { useStore } from '../../store/useStore'

export default function ServerList() {
  const servers          = useStore(s => s.servers)
  const selectedId       = useStore(s => s.selectedServerId)
  const selectServer     = useStore(s => s.selectServer)

  return (
    <nav className="w-16 flex-shrink-0 flex flex-col items-center gap-1.5 py-3 bg-deep border-r border-white/5 overflow-y-auto">
      {servers.map(srv => {
        const active = srv.id === selectedId
        return (
          <Tooltip key={srv.id} label={srv.name} side="right">
            <button
              onClick={() => selectServer(srv.id)}
              className={clsx(
                'relative w-11 h-11 flex items-center justify-center flex-shrink-0',
                'text-[13px] font-800 text-white transition-all duration-200 cursor-pointer select-none',
                active
                  ? 'rounded-2xl shadow-lg'
                  : 'rounded-full bg-high text-soft hover:rounded-2xl hover:text-bright',
              )}
              style={active && srv.color ? { background: srv.color, borderRadius: '14px' } :
                     active ? { background: '#7c6ef5', borderRadius: '14px', boxShadow: '0 0 18px rgba(124,110,245,0.4)' } :
                     srv.color ? { background: srv.color } : undefined}
            >
              <span className={clsx(!active && srv.color ? 'text-white' : undefined)}>
                {srv.initials}
              </span>
              <span
                className={clsx(
                  'absolute left-0 -translate-x-full rounded-r-full bg-bright transition-all duration-200',
                  active ? 'h-8 w-1' : 'h-4 w-1 opacity-0 group-hover:opacity-100',
                )}
              />
            </button>
          </Tooltip>
        )
      })}

      <div className="w-8 h-px bg-white/8 my-1 flex-shrink-0" />

      <Tooltip label="Add a Server" side="right">
        <button className="w-11 h-11 rounded-full flex items-center justify-center text-online border border-dashed border-online/30 bg-online/5 hover:rounded-2xl hover:bg-online hover:text-deep hover:border-transparent transition-all duration-200 flex-shrink-0 cursor-pointer">
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </Tooltip>

      <div className="mt-auto flex-shrink-0">
        <Tooltip label="Explore Servers" side="right">
          <button className="w-11 h-11 rounded-full flex items-center justify-center text-ghost bg-high hover:rounded-2xl hover:text-soft hover:bg-lift transition-all duration-200 cursor-pointer">
            <Compass size={18} strokeWidth={1.8} />
          </button>
        </Tooltip>
      </div>
    </nav>
  )
}
