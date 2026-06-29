import { useState } from 'react'
import { Copy, Check, Link2, Users } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useStore } from '../../store/useStore'

interface Props { open: boolean; onClose: () => void }

export default function InviteModal({ open, onClose }: Props) {
  const servers          = useStore(s => s.servers)
  const selectedServerId = useStore(s => s.selectedServerId)
  const [copied, setCopied] = useState(false)

  const space = servers.find(s => s.id === selectedServerId)

  const copyId = async () => {
    if (!selectedServerId) return
    await navigator.clipboard.writeText(selectedServerId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite People" description={`Share access to ${space?.name ?? 'this space'}`}>
      <div className="space-y-5">
        {/* How it works */}
        <div className="flex items-start gap-3 p-4 bg-raised rounded-xl border border-white/6">
          <Users size={16} className="text-brand mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-600 text-ink-100 mb-1">How to invite someone</p>
            <p className="text-xs font-400 text-ink-400 leading-relaxed">
              Copy the Space ID below and send it to anyone you want to invite. They paste it into the <span className="text-brand font-600">Join a Space</span> dialog on their home screen.
            </p>
          </div>
        </div>

        {/* Space ID */}
        <div>
          <p className="text-[10px] font-700 uppercase tracking-wider text-ink-600 mb-2">Space ID</p>
          <div className="flex items-center gap-2 p-3 bg-raised rounded-xl border border-white/8">
            <Link2 size={13} className="text-ink-400 flex-shrink-0" />
            <code className="flex-1 text-xs font-500 text-ink-100 break-all">{selectedServerId}</code>
            <button
              onClick={copyId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-700 transition-all cursor-pointer flex-shrink-0"
              style={{
                background: copied ? 'rgba(6,214,160,0.15)' : 'var(--color-lift)',
                color: copied ? '#06d6a0' : 'var(--color-ink-100)',
                border: copied ? '1px solid rgba(6,214,160,0.3)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-ink-600 text-center">
          The Space ID gives anyone who has it the ability to join — only share with people you trust.
        </p>
      </div>
    </Modal>
  )
}
