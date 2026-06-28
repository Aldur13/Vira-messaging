import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import { Tooltip } from './Tooltip'

interface IconButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  active?: boolean
  danger?: boolean
  size?: number
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  active,
  danger,
  size = 15,
  className,
  side = 'top',
}: IconButtonProps) {
  return (
    <Tooltip label={label} side={side}>
      <button
        onClick={onClick}
        className={clsx(
          'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer flex-shrink-0',
          'text-ghost hover:bg-lift hover:text-soft',
          active && 'text-accent',
          danger && 'text-danger hover:bg-danger/10',
          className,
        )}
      >
        <Icon size={size} strokeWidth={1.8} />
      </button>
    </Tooltip>
  )
}
