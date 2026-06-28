import clsx from 'clsx'
import type { BadgeType, MemberRole } from '../../types'

const roleMeta: Record<MemberRole, { label: string; className: string } | null> = {
  owner:  { label: 'Owner', className: 'text-warn bg-warn/10 border-warn/25' },
  admin:  { label: 'Admin', className: 'text-danger bg-danger/10 border-danger/25' },
  mod:    { label: 'Mod',   className: 'text-accent bg-accent/10 border-accent/25' },
  member: null,
}

const badgeMeta: Record<BadgeType, { label: string; className: string }> = {
  booster: { label: 'Booster', className: 'text-accent bg-accent/10 border-accent/25' },
  new:     { label: 'New',     className: 'text-online bg-online/10 border-online/25' },
  admin:   { label: 'Admin',   className: 'text-danger bg-danger/10 border-danger/25' },
}

interface RoleBadgeProps { role: MemberRole }
interface UserBadgeProps { badge: BadgeType }

const base = 'inline-flex items-center text-[9px] font-700 px-1.5 py-0.5 rounded-full border leading-none'

export function RoleBadge({ role }: RoleBadgeProps) {
  const meta = roleMeta[role]
  if (!meta) return null
  return <span className={clsx(base, meta.className)}>{meta.label}</span>
}

export function UserBadge({ badge }: UserBadgeProps) {
  const meta = badgeMeta[badge]
  return <span className={clsx(base, meta.className)}>{meta.label}</span>
}
