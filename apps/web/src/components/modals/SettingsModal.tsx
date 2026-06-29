import { useState } from 'react'
import { Check, LogOut, Lock, Shield, Bell, User } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { Avatar } from '../ui/Avatar'
import { useStore } from '../../store/useStore'
import { api } from '../../lib/api'
import type { User as UserType, Status } from '../../types'

const statuses: { id: Status; label: string; dot: string }[] = [
  { id: 'online',  label: 'Online',          dot: 'bg-online' },
  { id: 'idle',    label: 'Away',             dot: 'bg-warn' },
  { id: 'dnd',     label: 'Do Not Disturb',  dot: 'bg-danger' },
  { id: 'offline', label: 'Appear Offline',  dot: 'bg-ink-600' },
]

interface Props { open: boolean; onClose: () => void }

type Tab = 'account' | 'privacy' | 'notifications'

export default function SettingsModal({ open, onClose }: Props) {
  const currentUser = useStore(s => s.currentUser)
  const token       = useStore(s => s.token)
  const logout      = useStore(s => s.logout)
  const [tab, setTab]     = useState<Tab>('account')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  if (!currentUser) return null

  const user: UserType = {
    id: currentUser.id, username: currentUser.username,
    initials: currentUser.initials, color: currentUser.color,
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
    } finally { setSaving(false) }
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'account',       label: 'Account',       icon: User },
    { id: 'privacy',       label: 'Privacy',        icon: Shield },
    { id: 'notifications', label: 'Notifications',  icon: Bell },
  ]

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="modal-enter pointer-events-auto w-full max-w-2xl h-[520px] rounded-2xl border border-white/10 shadow-2xl flex overflow-hidden"
               style={{ background: 'var(--color-surface)' }}>

            {/* Left sidebar */}
            <div className="w-48 flex-shrink-0 border-r border-white/8 flex flex-col p-3" style={{ background: 'var(--color-deep)' }}>
              <p className="text-[10px] font-700 uppercase tracking-wider text-ink-600 px-3 py-2">Settings</p>
              {tabs.map(t => {
                const Icon = t.icon
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-500 transition-all cursor-pointer text-left ${tab === t.id ? 'text-brand font-600' : 'text-ink-400 hover:text-ink-100 hover:bg-raised'}`}
                    style={tab === t.id ? { background: 'rgba(6,214,160,0.1)' } : undefined}
                  >
                    <Icon size={14} strokeWidth={1.8} />
                    {t.label}
                  </button>
                )
              })}
              <div className="mt-auto pt-3 border-t border-white/8">
                <button onClick={() => { logout(); onClose() }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-500 text-danger hover:bg-danger/10 transition-colors cursor-pointer w-full">
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <Dialog.Title className="text-base font-700 text-ink-100 mb-5">
                {tabs.find(t => t.id === tab)?.label}
              </Dialog.Title>

              {tab === 'account' && (
                <div className="space-y-6">
                  {/* Profile */}
                  <div className="flex items-center gap-4 p-4 bg-raised rounded-2xl border border-white/6">
                    <Avatar user={user} size="lg" showStatus />
                    <div>
                      <p className="text-base font-700 text-ink-100">{user.username}</p>
                      <p className="text-xs text-ink-400 mt-0.5">#{user.discriminator}</p>
                    </div>
                    {saved && (
                      <div className="ml-auto flex items-center gap-1 text-xs font-600 text-brand">
                        <Check size={12} /> Saved
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-[10px] font-700 uppercase tracking-wider text-ink-600 mb-3">Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {statuses.map(s => (
                        <button key={s.id} onClick={() => setStatus(s.id)} disabled={saving}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all disabled:opacity-50"
                          style={{
                            background: user.status === s.id ? 'rgba(6,214,160,0.1)' : 'var(--color-raised)',
                            border: user.status === s.id ? '1px solid rgba(6,214,160,0.3)' : '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                          <span className={`text-sm font-500 ${user.status === s.id ? 'text-brand' : 'text-ink-100'}`}>{s.label}</span>
                          {user.status === s.id && <Check size={12} className="ml-auto text-brand" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'privacy' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-raised rounded-xl border border-white/6">
                    <Lock size={16} className="text-brand mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-600 text-ink-100 mb-1">End-to-End Encryption</p>
                      <p className="text-xs text-ink-400 leading-relaxed">
                        All your messages are encrypted with <span className="text-brand font-600">nacl.secretbox</span> (XSalsa20-Poly1305) before leaving your device. Your encryption keys are stored only in your browser's IndexedDB — Vira's servers never see plaintext.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-raised rounded-xl border border-white/6">
                    <Shield size={16} className="text-brand2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-600 text-ink-100 mb-1">Key Storage</p>
                      <p className="text-xs text-ink-400 leading-relaxed">
                        Your identity key pair (X25519) and channel keys are stored in IndexedDB, which is sandboxed per origin. Clearing your browser data will remove your keys — messages sent before that point cannot be decrypted on this device.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'notifications' && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Bell size={32} className="text-ink-600" />
                  <p className="text-sm font-600 text-ink-400">Notification settings coming soon</p>
                  <p className="text-xs text-ink-600">Push notifications are planned for the next release</p>
                </div>
              )}
            </div>

            {/* Close */}
            <Dialog.Close className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-raised transition-colors cursor-pointer">
              ✕
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
