import * as RadixTooltip from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

interface TooltipProps {
  label: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
}

export function Tooltip({ label, children, side = 'top', sideOffset = 8 }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>
        {children}
      </RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={sideOffset}
          className="z-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-bright bg-deep border border-white/8 shadow-xl animate-in fade-in-0 zoom-in-95 duration-100 select-none pointer-events-none"
        >
          {label}
          <RadixTooltip.Arrow className="fill-deep" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
