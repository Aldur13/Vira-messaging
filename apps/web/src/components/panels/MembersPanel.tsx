import clsx from 'clsx'
import type { Status } from '../../types'
import { Avatar } from '../ui/Avatar'
import { RoleBadge } from '../ui/Badge'
import { SkeletonMember } from '../ui/Skeleton'
import { Tooltip } from '../ui/Tooltip'
import { useStore } from '../../store/useStore'

const statusLabel: Record<Status, string> = {
  online: 'Online', idle: 'Away', dnd: 'Do Not Disturb', offline: 'Offline',
}

export default function MembersPanel() {
  const members   = useStore(s => s.members)
  const isLoading = useStore(s => s.isLoading)

  const online  = members.filter(m => m.user.status !== 'offline')
  const offline = members.filter(m => m.user.status === 'offline')

  const renderMember = (m: typeof members[number]) => {
    const u = m.user
    return (
      <Tooltip key={u.id} label={`${u.username} — ${statusLabel[u.status]}`} side="left">
        <div className={clsx(
          'flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-colors hover:bg-raised',
          u.status === 'offline' && 'opacity-40',
        )}>
          <Avatar user={u} size="sm" showStatus />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-600 text-ink-100 truncate">{u.username}</span>
              <RoleBadge role={m.role} />
            </div>
            <p className="text-[10px] font-400 text-ink-400 truncate">{statusLabel[u.status]}</p>
          </div>
        </div>
      </Tooltip>
    )
  }

  return (
    <div className="h-full overflow-y-auto py-4 px-2" style={{ background: 'var(--color-deep)' }}>
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => <SkeletonMember key={i} />)
      ) : (
        <>
          {online.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-700 uppercase tracking-[0.8px] text-ink-600 px-3 mb-2">
                Online — {online.length}
              </p>
              {online.map(renderMember)}
            </div>
          )}
          {offline.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-700 uppercase tracking-[0.8px] text-ink-600 px-3 mb-2">
                Offline — {offline.length}
              </p>
              {offline.map(renderMember)}
            </div>
          )}
          {members.length === 0 && (
            <p className="text-xs text-ink-600 text-center py-8">No members yet</p>
          )}
        </>
      )}
    </div>
  )
}
