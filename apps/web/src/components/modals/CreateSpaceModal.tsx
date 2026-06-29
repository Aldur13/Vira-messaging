import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal, ModalInput, ModalBtn } from '../ui/Modal'
import { useStore } from '../../store/useStore'

const GRADIENTS = [
  'linear-gradient(135deg,#06d6a0,#818cf8)',
  'linear-gradient(135deg,#f97316,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#6366f1)',
  'linear-gradient(135deg,#a78bfa,#ec4899)',
  'linear-gradient(135deg,#fbbf24,#f97316)',
  'linear-gradient(135deg,#4ade80,#06b6d4)',
]

interface Props { open: boolean; onClose: () => void }

export default function CreateSpaceModal({ open, onClose }: Props) {
  const [name, setName]       = useState('')
  const [color, setColor]     = useState(GRADIENTS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const createSpace = useStore(s => s.createSpace)

  const submit = async () => {
    if (!name.trim()) return
    setLoading(true); setError('')
    try {
      await createSpace(name.trim(), color)
      setName(''); onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a Space" description="Spaces are where your community lives">
      <div className="space-y-5">
        {/* Color picker */}
        <div>
          <p className="text-xs font-600 text-ink-400 uppercase tracking-wider mb-3">Space Colour</p>
          <div className="flex gap-2.5 flex-wrap">
            {GRADIENTS.map(g => (
              <button
                key={g}
                onClick={() => setColor(g)}
                className="w-9 h-9 rounded-xl cursor-pointer transition-all hover:scale-110"
                style={{
                  background: g,
                  outline: color === g ? '2px solid #06d6a0' : '2px solid transparent',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 bg-raised rounded-xl">
          <div className="w-10 h-10 hex-clip flex items-center justify-center text-sm font-700 text-white flex-shrink-0"
               style={{ background: color }}>
            {name.trim() ? name.trim().slice(0,2).toUpperCase() : 'VS'}
          </div>
          <div>
            <p className="text-sm font-600 text-ink-100">{name.trim() || 'Your Space'}</p>
            <p className="text-xs text-ink-400">Just you for now</p>
          </div>
        </div>

        {/* Name */}
        <div>
          <p className="text-xs font-600 text-ink-400 uppercase tracking-wider mb-2">Space Name</p>
          <ModalInput
            placeholder="e.g. Design Squad"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            maxLength={50}
            autoFocus
          />
        </div>

        {error && <p className="text-xs font-600 text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">{error}</p>}

        <ModalBtn onClick={submit} disabled={loading || !name.trim()}>
          {loading ? <Loader2 size={14} className="animate-spin inline mr-2" /> : null}
          {loading ? 'Creating…' : 'Create Space'}
        </ModalBtn>
      </div>
    </Modal>
  )
}
