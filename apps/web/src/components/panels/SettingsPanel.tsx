import { useState } from 'react'
import { Check, LogOut } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { useStore } from '../../store/useStore'
import { api } from '../../lib/api'
import type { User, Status } from '../../types'

const statuses: { id: Status; label: string; color: string }[] = [
  { id: 'online',  label: 'Online',           color: 'bg-online' },
  { id: 'idle',    label: 'Away',              color: 'bg-warn' },
  { id: 'dnd',     label: 'Do Not Disturb',   color: 'bg-danger' },
  { id: 'offline', label: 'Appear Offline',   color: 'bg-ink-600' },
]

export default function SettingsPanel() {
  const currentUser = useStore(s => s.currentUser)
  const token       = useStore(s => s.token)
  const logout      = useStore(s => s.logout)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  if (!currentUser) return null

  const user: User = {
    id: currentUser.id,
    username: currentUser.username,
    initials: currentUser.initials,
    color: currentUser.color,
    discriminator: currentUser.discriminator,
    status: (currentUser.status as Status) ?? 'online',
  }

  const setStatus = async (s: Status) => {
    if (!token) return
    setSaving(true)
    try {
      await api.auth.status(token, s)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-deep)' }}>
      <div className="px-4 py-3 border-b border-white/6 flex-shrink-0">
        <p className="text-xs font-700 text-ink-100">Settings</p>
        <p className="text-[10px] text-ink-400 mt-0.5">Your account and preferences</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Profile card */}
        <div className="flex items-center gap-3 p-4 bg-raised rounded-2xl border border-white/6">
          <Avatar user={user} size="lg" showStatus />
          <div className="min-w-0">
            <p className="text-sm font-700 text-ink-100">{user.username}</p>
            <p className="text-[11px] font-500 text-ink-400">#{user.discriminator}</p>
          </div>
          {saved && (
            <div className="ml-auto flex items-center gap-1 text-[11px] font-600 text-brand">
              <Check size={11} /> Saved
            </div>
          )}
        </div>

        {/* Status selector */}
        <div>
          <p className="text-[10px] font-700 uppercase tracking-wider text-ink-600 mb-3">Status</p>
          <div className="space-y-1.5">
            {statuses.map(s => (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                disabled={saving}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all hover:bg-raised disabled:opacity-50"
                style={user.status === s.id ? { background: 'var(--color-raised)', borderLeft: '2px solid #06d6a0' } : undefined}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                <span className="text-sm font-500 text-ink-100">{s.label}</span>
                {user.status === s.id && <Check size={13} className="ml-auto text-brand" />}
              </button>
            ))}
          </div>
        </div>

        {/* Encryption info */}
        <div className="p-3 bg-raised rounded-xl border border-white/6 space-y-1">
          <p className="text-[10px] font-700 uppercase tracking-wider text-ink-600 mb-2">Security</p>
          <p className="text-[11px] text-ink-400 leading-relaxed">
            Your messages are encrypted with <span className="text-brand font-600">nacl.secretbox</span> (XSalsa20-Poly1305). Encryption keys are stored only on your device in IndexedDB — the server never sees plaintext.
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-600 text-danger border border-danger/20 hover:bg-danger/10 transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
