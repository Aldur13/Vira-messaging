import { forwardRef, InputHTMLAttributes } from 'react'

interface FuturisticInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const FuturisticInput = forwardRef<HTMLInputElement, FuturisticInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-600 text-blue-300/80 mb-2.5">
            {label}
          </label>
        )}
        <div className="relative group">
          <input
            ref={ref}
            {...props}
            className={`
              w-full px-5 py-3.5 text-sm font-500
              bg-gradient-to-br from-white/5 to-white/3
              border border-white/10
              rounded-xl backdrop-blur-sm
              text-white placeholder:text-white/35
              outline-none transition-all duration-300
              focus:border-blue-400/50 focus:bg-white/8
              hover:border-white/20 hover:bg-white/6
              ${error ? 'border-red-500/40 focus:border-red-400/60 focus:bg-red-500/5' : ''}
              ${className || ''}
            `}
            style={{
              boxShadow: error
                ? 'inset 0 1px 3px rgba(255, 255, 255, 0.05), 0 0 20px rgba(239, 68, 68, 0.2)'
                : 'inset 0 1px 3px rgba(255, 255, 255, 0.05), 0 0 20px rgba(59, 130, 246, 0.1)'
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.boxShadow = 'inset 0 2px 8px rgba(255, 255, 255, 0.1), 0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.currentTarget.style.boxShadow = 'inset 0 1px 3px rgba(255, 255, 255, 0.05), 0 0 20px rgba(59, 130, 246, 0.1)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              }
            }}
          />

          {/* Animated focus glow */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              boxShadow: 'inset 0 0 20px rgba(59, 130, 246, 0.1)'
            }}
          />
        </div>

        {error && (
          <p className="text-xs font-600 text-red-400 mt-2.5 flex items-center gap-1.5 animate-pulse">
            <span className="w-1 h-1 rounded-full bg-red-400" />
            {error}
          </p>
        )}
      </div>
    )
  },
)

FuturisticInput.displayName = 'FuturisticInput'
