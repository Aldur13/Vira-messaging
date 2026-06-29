import { useState } from 'react'
import { Plus, Link2, ArrowRight, Lock } from 'lucide-react'
import { ViraLogo } from '../components/ui/ViraLogo'
import CreateSpaceModal from '../components/modals/CreateSpaceModal'
import JoinSpaceModal from '../components/modals/JoinSpaceModal'
import { useStore } from '../store/useStore'

export default function HomeView() {
  const servers      = useStore(s => s.servers)
  const currentUser  = useStore(s => s.currentUser)
  const selectServer = useStore(s => s.selectServer)
  const isLoading    = useStore(s => s.isLoadingServers)

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin]     = useState(false)

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--color-void)' }}>
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Welcome header */}
        <div className="mb-10">
          <h1 className="text-2xl font-800 text-ink-100">
            Welcome back{currentUser ? `, ${currentUser.username}` : ''}
          </h1>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs font-500 text-brand">
            <Lock size={10} strokeWidth={2.5} />
            All messages are end-to-end encrypted
          </div>
        </div>

        {/* Your Spaces */}
        <section>
          <h2 className="text-[11px] font-700 uppercase tracking-[1px] text-ink-400 mb-4">Your Spaces</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-2xl" />
              ))
            ) : (
              servers.map(srv => (
                <button
                  key={srv.id}
                  onClick={() => selectServer(srv.id)}
                  className="group relative overflow-hidden rounded-2xl p-5 text-left cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
                  style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {/* Gradient top strip */}
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                       style={{ background: srv.color ?? 'linear-gradient(135deg,#06d6a0,#818cf8)' }} />

                  <div className="flex items-start gap-3 mt-2">
                    {/* Space icon */}
                    <div className="w-10 h-10 hex-clip flex items-center justify-center text-sm font-700 text-white flex-shrink-0"
                         style={{ background: srv.color ?? 'linear-gradient(135deg,#06d6a0,#818cf8)' }}>
                      {srv.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-700 text-ink-100 truncate">{srv.name}</p>
                      <p className="text-[11px] text-ink-400 mt-0.5">
                        {srv.memberCount ?? 0} member{(srv.memberCount ?? 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-ink-600 group-hover:text-brand transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              ))
            )}

            {/* Create new space card */}
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-2xl p-5 text-left cursor-pointer transition-all duration-200 hover:scale-[1.02] flex items-center gap-3 group"
              style={{ background: 'var(--color-surface)', border: '1px dashed rgba(6,214,160,0.3)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-brand transition-colors group-hover:bg-brand group-hover:text-void"
                   style={{ background: 'rgba(6,214,160,0.1)' }}>
                <Plus size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-700 text-brand">Create a Space</p>
                <p className="text-[11px] text-ink-400 mt-0.5">Start a new community</p>
              </div>
            </button>

            {/* Join by ID card */}
            <button
              onClick={() => setShowJoin(true)}
              className="rounded-2xl p-5 text-left cursor-pointer transition-all duration-200 hover:scale-[1.02] flex items-center gap-3 group"
              style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-ink-400 transition-colors group-hover:text-brand"
                   style={{ background: 'var(--color-raised)' }}>
                <Link2 size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-700 text-ink-100 group-hover:text-brand transition-colors">Join a Space</p>
                <p className="text-[11px] text-ink-400 mt-0.5">Enter with a Space ID</p>
              </div>
            </button>
          </div>
        </section>

        {/* Footer branding */}
        <div className="mt-16 flex items-center gap-2 text-ink-600">
          <ViraLogo size={18} />
          <span className="text-xs font-600">Vira — encrypted by default</span>
        </div>
      </div>

      <CreateSpaceModal open={showCreate} onClose={() => setShowCreate(false)} />
      <JoinSpaceModal   open={showJoin}   onClose={() => setShowJoin(false)} />
    </div>
  )
}
