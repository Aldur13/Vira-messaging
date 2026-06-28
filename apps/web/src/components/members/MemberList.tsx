import clsx from 'clsx'
import type { Status } from '../../types'
import { Avatar } from '../ui/Avatar'
import { RoleBadge } from '../ui/Badge'
import { SkeletonMember } from '../ui/Skeleton'
import { Tooltip } from '../ui/Tooltip'
import { useStore } from '../../store/useStore'

const statusLabel: Record<Status, string> = {
  online:  'Online',
  idle:    'Away',
  dnd:     'Do Not Disturb',
  offline: 'Offline',
}

export default function MemberList() {
  const members   = useStore(s => s.members)
  const isLoading = useStore(s => s.isLoading)

  const online  = members.filter(m => m.user.status !== 'offline')
  const offline = members.filter(m => m.user.status === 'offline')

  const renderMember = (m: typeof members[number]) => {
    const u = m.user
    const isOffline = u.status === 'offline'
    return (
      <Tooltip key={u.id} label={`${u.username} — ${statusLabel[u.status]}`} side="left">
        <div
          className={clsx(
            'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-lift',
            isOffline && 'opacity-40',
          )}
        >
          <Avatar user={u} size="sm" showStatus />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-600 text-bright truncate">{u.username}</span>
              <RoleBadge role={m.role} />
            </div>
            <p className="text-[10px] font-500 text-ghost truncate">{statusLabel[u.status]}</p>
          </div>
        </div>
      </Tooltip>
    )
  }

  return (
    <div className="w-56 flex-shrink-0 bg-dark border-l border-white/5 overflow-y-auto py-3 px-2">
      {isLoading ? (
        <>
          <div className="text-[10px] font-700 uppercase tracking-[0.7px] text-ghost px-2 mb-2">Members</div>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonMember key={i} />)}
        </>
      ) : (
        <>
          {online.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-700 uppercase tracking-[0.7px] text-ghost px-2 mb-1.5">
                Online — {online.length}
              </p>
              {online.map(renderMember)}
            </div>
          )}
          {offline.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-700 uppercase tracking-[0.7px] text-ghost px-2 mb-1.5">
                Offline — {offline.length}
              </p>
              {offline.map(renderMember)}
            </div>
          )}
          {members.length === 0 && (
            <p className="text-xs text-ghost px-2 py-4 text-center">No members yet</p>
          )}
        </>
      )}
    </div>
  )
}
