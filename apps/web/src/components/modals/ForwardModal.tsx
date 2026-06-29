import { X, Send } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Modal } from '../ui/Modal'

interface Props {
  open: boolean
  messageId: string | null
  onClose: () => void
}

export default function ForwardModal({ open, messageId, onClose }: Props) {
  const channels = useStore(s => s.channels)
  const selectedChannelId = useStore(s => s.selectedChannelId)
  const forwardMessage = useStore(s => s.forwardMessage)

  const handleForward = async (targetId: string) => {
    if (!messageId) return
    await forwardMessage(messageId, targetId)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 max-w-md w-full border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-700 text-white">Forward message</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
            <X size={18} className="text-white/60" />
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => handleForward(ch.id)}
              disabled={ch.id === selectedChannelId}
              className="w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-white/10 hover:border-white/20"
            >
              <span className="text-lg">{ch.type === 'text' ? '#' : '🎙️'}</span>
              <div>
                <p className="text-sm font-600 text-white">{ch.name}</p>
                {ch.description && <p className="text-xs text-white/60">{ch.description}</p>}
              </div>
              {ch.id !== selectedChannelId && <Send size={14} className="ml-auto text-blue-300" />}
            </button>
          ))}
        </div>

        {channels.length === 0 && (
          <p className="text-center text-white/60 text-sm py-8">No channels available</p>
        )}
      </div>
    </Modal>
  )
}
