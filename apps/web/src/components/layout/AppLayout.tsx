import TopNav from './TopNav'
import HomeView from '../../screens/HomeView'
import ChannelList from '../channels/ChannelList'
import ChatArea from '../chat/ChatArea'
import MemberList from '../members/MemberList'
import { useStore } from '../../store/useStore'

export default function AppLayout() {
  const selectedServerId = useStore(s => s.selectedServerId)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-void)' }}>
      <TopNav />

      <div className="flex-1 min-h-0 overflow-hidden">
        {!selectedServerId ? (
          /* Home dashboard — card grid of spaces */
          <HomeView />
        ) : (
          /* Space view — room list + chat */
          <div className="flex h-full">
            <ChannelList />
            <ChatArea />
            <MemberList />
          </div>
        )}
      </div>
    </div>
  )
}
