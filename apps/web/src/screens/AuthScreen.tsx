import { useState, type KeyboardEvent } from 'react'
import { Lock, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { ViraLogo } from '../components/ui/ViraLogo'
import { FuturisticInput } from '../components/ui/FuturisticInput'
import { useStore } from '../store/useStore'

type Tab = 'login' | 'register'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validateEmail(e: string): string {
  if (!e.trim()) return 'Email is required'
  if (!EMAIL_RE.test(e.trim())) return 'Enter a valid email address (e.g. you@example.com)'
  return ''
}

export default function AuthScreen() {
  const [tab, setTab]       = useState<Tab>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')

  const login          = useStore(s => s.login)
  const register       = useStore(s => s.register)
  const authError      = useStore(s => s.authError)
  const isAuthLoading  = useStore(s => s.isAuthLoading)
  const clearAuthError = useStore(s => s.clearAuthError)

  const switchTab = (t: Tab) => { setTab(t); clearAuthError(); setEmailError('') }

  const handleEmailChange = (v: string) => {
    setEmail(v)
    if (emailError) setEmailError(validateEmail(v))
  }

  const submit = async () => {
    if (!username.trim() || !password) return
    if (tab === 'login') {
      await login(username.trim(), password)
    } else {
      const err = validateEmail(email)
      if (err) { setEmailError(err); return }
      setEmailError('')
      await register(username.trim(), email.trim(), password)
    }
  }

  const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') submit() }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a0b2e 50%, #0f1729 100%)' }}>

      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(0deg, rgba(59,130,246,0.1) 1px, transparent 1px)',
             backgroundSize: '50px 50px',
             animation: 'slide 20s linear infinite'
           }} />

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full pointer-events-none opacity-30 blur-3xl"
           style={{
             background: 'radial-gradient(circle, rgba(59,130,246,0.8) 0%, transparent 70%)',
             animation: 'float 8s ease-in-out infinite'
           }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none opacity-30 blur-3xl"
           style={{
             background: 'radial-gradient(circle, rgba(139,92,246,0.8) 0%, transparent 70%)',
             animation: 'float 8s ease-in-out infinite 2s'
           }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-50px); }
        }
        @keyframes slide {
          0% { background-position: 0 0; }
          100% { background-position: 50px 50px; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.1); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), inset 0 0 30px rgba(59, 130, 246, 0.2); }
        }
      `}</style>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6 animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="relative">
              <ViraLogo size={80} />
              <Sparkles className="absolute -top-2 -right-2 text-blue-400 animate-spin" size={20} style={{ animationDuration: '4s' }} />
            </div>
          </div>
          <h1 className="text-5xl font-800 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">Vira</h1>
          <p className="text-sm font-600 text-blue-300/80 flex items-center justify-center gap-2">
            <Lock size={12} />
            End-to-End Encrypted by Default
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 shadow-2xl transition-all duration-300"
             style={{
               boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
             }}>

          {/* Tabs */}
          <div className="flex gap-1 p-1.5 bg-white/5 rounded-xl mb-8 border border-white/5">
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className="flex-1 py-2.5 text-sm font-700 rounded-lg transition-all duration-200 relative overflow-hidden"
                style={{
                  background: tab === t ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'transparent',
                  color: tab === t ? 'white' : '#94a3b8',
                  boxShadow: tab === t ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none'
                }}
              >
                {tab === t && <div className="absolute inset-0 animate-pulse opacity-20" style={{ background: 'linear-gradient(45deg, transparent 30%, white 50%, transparent 70%)' }} />}
                <span className="relative">{t === 'login' ? 'Sign In' : 'Create Account'}</span>
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="space-y-5">
            <FuturisticInput
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={onKey}
              autoComplete="username"
            />

            {tab === 'register' && (
              <FuturisticInput
                type="email"
                placeholder="Email (e.g. you@example.com)"
                value={email}
                onChange={e => handleEmailChange(e.target.value)}
                onBlur={() => setEmailError(validateEmail(email))}
                onKeyDown={onKey}
                autoComplete="email"
                error={emailError}
              />
            )}

            <FuturisticInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={onKey}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {/* Error */}
          {authError && (
            <div className="mt-6 px-4 py-3 rounded-xl backdrop-blur bg-red-500/10 border border-red-500/30 text-xs font-600 text-red-300">
              {authError}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={submit}
            disabled={isAuthLoading}
            className="w-full mt-8 py-3.5 rounded-xl text-white text-sm font-700 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 40px rgba(59, 130, 246, 0.8)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.5)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center gap-2">
              {isAuthLoading && <Loader2 size={16} className="animate-spin" />}
              {isAuthLoading ? 'Connecting…' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </span>
          </button>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-8">
          {[
            { icon: ShieldCheck, text: 'nacl.secretbox' },
            { icon: Lock,        text: 'Zero-knowledge' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-[11px] font-600 text-blue-300/70 hover:text-blue-300 transition-colors">
              <Icon size={13} className="text-blue-400" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Demo hint */}
        <p className="text-center text-[10px] font-500 text-blue-300/50 mt-4">
          Demo: <span className="text-soft">aldur · marix · zerayn</span> — pw: <span className="text-soft">password123</span>
        </p>
      </div>
    </div>
  )
}
