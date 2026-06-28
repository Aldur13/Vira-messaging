interface ViraLogoProps {
  size?: number
  className?: string
}

export function ViraLogo({ size = 48, className }: ViraLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="vira-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c6ef5" />
          <stop offset="100%" stopColor="#5eead4" />
        </linearGradient>
        <filter id="vira-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Hexagon body */}
      <path
        d="M32 3 L60 18.5 L60 45.5 L32 61 L4 45.5 L4 18.5 Z"
        fill="url(#vira-grad)"
      />
      {/* Inner hexagon (subtle depth) */}
      <path
        d="M32 10 L54 22.5 L54 41.5 L32 54 L10 41.5 L10 22.5 Z"
        fill="rgba(255,255,255,0.06)"
      />
      {/* V mark — thick, rounded */}
      <path
        d="M19 20 L32 44 L45 20"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Lock dot under V */}
      <circle cx="32" cy="51" r="2.5" fill="rgba(255,255,255,0.7)" />
    </svg>
  )
}

/** Wordmark: logo + "Vira" text side by side */
export function ViraWordmark({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <ViraLogo size={size} />
      <span
        className="font-800 text-bright tracking-tight"
        style={{ fontSize: size * 0.72 }}
      >
        Vira
      </span>
    </div>
  )
}
