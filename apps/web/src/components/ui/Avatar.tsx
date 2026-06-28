import clsx from 'clsx'
import type { User, Status } from '../../types'

const statusColor: Record<Status, string> = {
  online:  'bg-online',
  idle:    'bg-warn',
  dnd:     'bg-danger',
  offline: 'bg-ghost',
}

interface AvatarProps {
  user: User
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showStatus?: boolean
  className?: string
}

const sizes = {
  xs: { wrap: 'w-5 h-5 text-[8px] font-extrabold',   dot: 'w-2 h-2 border',   dotPos: 'bottom-[-1px] right-[-1px]' },
  sm: { wrap: 'w-7 h-7 text-[10px] font-extrabold',  dot: 'w-2.5 h-2.5 border-2', dotPos: 'bottom-[-1px] right-[-1px]' },
  md: { wrap: 'w-8 h-8 text-[11px] font-extrabold',  dot: 'w-2.5 h-2.5 border-2', dotPos: 'bottom-[-1px] right-[-1px]' },
  lg: { wrap: 'w-9 h-9 text-xs font-extrabold',      dot: 'w-3 h-3 border-2', dotPos: 'bottom-0 right-0' },
}

export function Avatar({ user, size = 'md', showStatus = false, className }: AvatarProps) {
  const s = sizes[size]
  return (
    <div
      className={clsx('relative flex-shrink-0 rounded-full flex items-center justify-center select-none text-white', s.wrap, className)}
      style={{ background: user.color }}
    >
      {user.initials}
      {showStatus && (
        <span
          className={clsx(
            'absolute rounded-full border-dark',
            s.dot, s.dotPos,
            statusColor[user.status],
          )}
        />
      )}
    </div>
  )
}
