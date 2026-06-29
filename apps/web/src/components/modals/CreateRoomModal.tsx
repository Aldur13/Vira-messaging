import { useState } from 'react'
import { Hash, Mic, Loader2 } from 'lucide-react'
import { Modal, ModalInput, ModalBtn } from '../ui/Modal'
import { useStore } from '../../store/useStore'

interface Props { open: boolean; onClose: () => void }

const types = [
  { id: 'text',  label: 'Text Room',  icon: Hash, desc: 'Send messages, files and links' },
  { id: 'voice', label: 'Voice Room', icon: Mic,  desc: 'Hang out with voice and video' },
] as const

export default function CreateRoomModal({ open, onClose }: Props) {
  const [name, setName]         = useState('')
  const [type, setType]         = useState<'text' | 'voice'>('text')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const createRoom = useStore(s => s.createRoom)

  const submit = async () => {
    if (!name.trim()) return
    setLoading(true); setError('')
    try {
      await createRoom(name.trim(), type)
      setName(''); onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a Room" description="Rooms are where conversations happen">
      <div className="space-y-5">
        {/* Type selector */}
        <div className="grid grid-cols-2 gap-2">
          {types.map(t => {
            const Icon = t.icon
            const active = type === t.id
            return (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className="p-4 rounded-xl border text-left cursor-pointer transition-all"
                style={{
                  background: active ? 'rgba(6,214,160,0.1)' : 'var(--color-raised)',
                  borderColor: active ? '#06d6a0' : 'rgba(255,255,255,0.08)',
                }}
              >
                <Icon size={18} className={active ? 'text-brand mb-2' : 'text-ink-400 mb-2'} />
                <p className={`text-xs font-700 ${active ? 'text-brand' : 'text-ink-100'}`}>{t.label}</p>
                <p className="text-[11px] text-ink-400 mt-0.5 font-400">{t.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Room name */}
        <div>
          <p className="text-xs font-600 text-ink-400 uppercase tracking-wider mb-2">Room Name</p>
          <ModalInput
            placeholder={type === 'voice' ? 'e.g. Lounge' : 'e.g. general'}
            value={name}
            onChange={e => setName(e.target.value.toLowerCase().replace(/\s/g, '-'))}
            onKeyDown={e => e.key === 'Enter' && submit()}
            maxLength={32}
            autoFocus
          />
          <p className="text-[11px] text-ink-600 mt-1.5">
            {type === 'text' ? '#' : '🎙 '}{name || 'room-name'}
          </p>
        </div>

        {error && <p className="text-xs font-600 text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">{error}</p>}

        <ModalBtn onClick={submit} disabled={loading || !name.trim()}>
          {loading ? <Loader2 size={14} className="animate-spin inline mr-2" /> : null}
          {loading ? 'Creating…' : 'Create Room'}
        </ModalBtn>
      </div>
    </Modal>
  )
}
