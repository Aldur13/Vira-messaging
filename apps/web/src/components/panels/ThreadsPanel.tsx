import { Layers } from 'lucide-react'

export default function ThreadsPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 gap-4 px-5 text-center"
         style={{ background: 'var(--color-deep)' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
           style={{ background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.2)' }}>
        <Layers size={22} className="text-brand" />
      </div>
      <div>
        <p className="text-sm font-700 text-ink-100 mb-1">Threads</p>
        <p className="text-xs text-ink-400 leading-relaxed">
          Reply to messages in threads to keep conversations organised. Coming in the next release.
        </p>
      </div>
    </div>
  )
}
