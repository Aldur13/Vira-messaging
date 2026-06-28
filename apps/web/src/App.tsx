import { useEffect } from 'react'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { Loader2 } from 'lucide-react'
import AppLayout from './components/layout/AppLayout'
import AuthScreen from './screens/AuthScreen'
import { useStore } from './store/useStore'

export default function App() {
  const isAuthenticated = useStore(s => s.isAuthenticated)
  const initAuth        = useStore(s => s.initAuth)
  const isLoading       = useStore(s => s.isLoadingServers)
  const token           = useStore(s => s.token)

  // On first mount: check localStorage for existing session
  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Brief loading state while we validate the stored token
  const isInitialising = !isAuthenticated && !!localStorage.getItem('vira:token') && !token

  if (isInitialising) {
    return (
      <div className="min-h-screen bg-deep flex items-center justify-center">
        <div className="flex items-center gap-3 text-soft text-sm font-600">
          <Loader2 size={18} className="animate-spin text-accent" />
          Connecting to Vira…
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={350} skipDelayDuration={100}>
      {isAuthenticated ? <AppLayout /> : <AuthScreen />}
    </TooltipProvider>
  )
}
