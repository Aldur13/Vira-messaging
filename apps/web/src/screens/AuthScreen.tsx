import { useState, type KeyboardEvent } from 'react'
import { Lock, Loader2 } from 'lucide-react'
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
    <div className="min-h-screen bg-deep flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-800 text-white shadow-xl"
            style={{ background: 'linear-gradient(135deg,#7c6ef5,#5eead4)' }}
          >
            V
          </div>
          <h1 className="text-2xl font-800 text-bright tracking-tight">Vira</h1>
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs font-600 text-teal">
            <Lock size={11} strokeWidth={2.5} />
            End-to-End Encrypted
          </div>
        </div>

        {/* Card */}
        <div className="bg-dark border border-white/6 rounded-2xl p-6 shadow-2xl">

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-deep rounded-xl mb-6">
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-2 text-xs font-700 rounded-lg transition-all duration-150 cursor-pointer ${
                  tab === t
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-ghost hover:text-soft'
                }`}
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
              className="w-full bg-high border border-white/6 rounded-xl px-4 py-3 text-sm font-500 text-bright placeholder:text-ghost outline-none focus:border-accent/40 transition-colors caret-accent"
            />
            {tab === 'register' && (
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={onKey}
                className="w-full bg-high border border-white/6 rounded-xl px-4 py-3 text-sm font-500 text-bright placeholder:text-ghost outline-none focus:border-accent/40 transition-colors caret-accent"
              />
            )}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={onKey}
              className="w-full bg-high border border-white/6 rounded-xl px-4 py-3 text-sm font-500 text-bright placeholder:text-ghost outline-none focus:border-accent/40 transition-colors caret-accent"
            />
          </div>

          {/* Error */}
          {authError && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-danger/10 border border-danger/25 text-xs font-600 text-danger">
              {authError}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={isAuthLoading}
            className="w-full mt-5 py-3 rounded-xl bg-accent hover:bg-[#8f84f7] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-700 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isAuthLoading && <Loader2 size={14} className="animate-spin" />}
            {isAuthLoading ? 'Loading…' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Demo hint */}
          <p className="text-center text-[10px] font-500 text-ghost mt-4">
            Demo accounts: <span className="text-soft">aldur / marix / zerayn</span> — password: <span className="text-soft">password123</span>
          </p>
        </div>
      </div>
    </div>
  )
}
