import { useState, type KeyboardEvent } from 'react'
import { Lock, Loader2, ShieldCheck } from 'lucide-react'
import { ViraLogo } from '../components/ui/ViraLogo'
import { useStore } from '../store/useStore'

type Tab = 'login' | 'register'

export default function AuthScreen() {
  const [tab, setTab]       = useState<Tab>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail]   = useState('')
  const [password, setPassword] = useState('')

  const login          = useStore(s => s.login)
  const register       = useStore(s => s.register)
  const authError      = useStore(s => s.authError)
  const isAuthLoading  = useStore(s => s.isAuthLoading)
  const clearAuthError = useStore(s => s.clearAuthError)

  const switchTab = (t: Tab) => { setTab(t); clearAuthError() }

  const submit = async () => {
    if (!username.trim() || !password) return
    if (tab === 'login') {
      await login(username.trim(), password)
    } else {
      if (!email.trim()) return
      await register(username.trim(), email.trim(), password)
    }
  }

  const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') submit() }

  return (
    <div className="min-h-screen bg-deep flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(124,110,245,0.12) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(94,234,212,0.08) 0%, transparent 70%)' }} />

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ViraLogo size={64} className="drop-shadow-xl" />
          </div>
          <h1 className="text-3xl font-800 text-bright tracking-tight">Vira</h1>
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs font-600 text-teal">
            <Lock size={11} strokeWidth={2.5} />
            End-to-End Encrypted by Default
          </div>
        </div>

        {/* Card */}
        <div className="glass border border-white/8 rounded-2xl p-6 shadow-2xl">

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-deep rounded-xl mb-6">
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={[
                  'flex-1 py-2 text-xs font-700 rounded-lg transition-all duration-150 cursor-pointer',
                  tab === t
                    ? 'text-white shadow-sm glow-accent'
                    : 'text-ghost hover:text-soft',
                ].join(' ')}
                style={tab === t ? { background: 'linear-gradient(135deg,#7c6ef5,#5eead4)' } : undefined}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={onKey}
              autoComplete="username"
              className="w-full bg-high border border-white/8 rounded-xl px-4 py-3 text-sm font-500 text-bright placeholder:text-ghost outline-none focus:border-accent/50 transition-colors caret-accent"
            />
            {tab === 'register' && (
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={onKey}
                autoComplete="email"
                className="w-full bg-high border border-white/8 rounded-xl px-4 py-3 text-sm font-500 text-bright placeholder:text-ghost outline-none focus:border-accent/50 transition-colors caret-accent"
              />
            )}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={onKey}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              className="w-full bg-high border border-white/8 rounded-xl px-4 py-3 text-sm font-500 text-bright placeholder:text-ghost outline-none focus:border-accent/50 transition-colors caret-accent"
            />
          </div>

          {/* Error */}
          {authError && (
            <div className="mt-4 px-3 py-2 rounded-xl bg-danger/10 border border-danger/25 text-xs font-600 text-danger">
              {authError}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={submit}
            disabled={isAuthLoading}
            className="w-full mt-5 py-3 rounded-xl text-white text-sm font-700 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#7c6ef5,#5eead4)' }}
          >
            {isAuthLoading && <Loader2 size={14} className="animate-spin" />}
            {isAuthLoading ? 'Connecting…' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-6">
          {[
            { icon: ShieldCheck, text: 'nacl.secretbox' },
            { icon: Lock,        text: 'Zero-knowledge' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1 text-[10px] font-600 text-ghost">
              <Icon size={11} className="text-teal" />
              {text}
            </div>
          ))}
        </div>

        {/* Demo hint */}
        <p className="text-center text-[10px] font-500 text-ghost mt-3">
          Demo: <span className="text-soft">aldur · marix · zerayn</span> — pw: <span className="text-soft">password123</span>
        </p>
      </div>
    </div>
  )
}
