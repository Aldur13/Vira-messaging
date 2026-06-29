import { useState } from 'react'
import { Link2, Loader2 } from 'lucide-react'
import { Modal, ModalInput, ModalBtn } from '../ui/Modal'
import { useStore } from '../../store/useStore'

interface Props { open: boolean; onClose: () => void }

export default function JoinSpaceModal({ open, onClose }: Props) {
  const [id, setId]           = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const joinSpace = useStore(s => s.joinSpace)

  const submit = async () => {
    const trimmed = id.trim()
    if (!trimmed) return
    setLoading(true); setError('')
    try {
      await joinSpace(trimmed)
      setId(''); onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Join a Space" description="Enter a Space ID to join an existing community">
      <div className="space-y-5">
        <div className="flex items-start gap-3 p-4 bg-raised rounded-xl border border-white/6">
          <Link2 size={16} className="text-brand mt-0.5 flex-shrink-0" />
          <p className="text-xs text-ink-400 font-400 leading-relaxed">
            Ask your friend for their Space ID from the space settings page, then paste it below.
          </p>
        </div>

        <div>
          <p className="text-xs font-600 text-ink-400 uppercase tracking-wider mb-2">Space ID</p>
          <ModalInput
            placeholder="e.g. a1b2c3d4-e5f6-..."
            value={id}
            onChange={e => setId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus
          />
        </div>

        {error && <p className="text-xs font-600 text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">{error}</p>}

        <ModalBtn onClick={submit} disabled={loading || !id.trim()}>
          {loading ? <Loader2 size={14} className="animate-spin inline mr-2" /> : null}
          {loading ? 'Joining…' : 'Join Space'}
        </ModalBtn>
      </div>
    </Modal>
  )
}
