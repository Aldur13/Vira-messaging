import TopNav from './TopNav'
import HomeView from '../../screens/HomeView'
import ChannelList from '../channels/ChannelList'
import ChatArea from '../chat/ChatArea'
import MembersPanel from '../panels/MembersPanel'
import SearchPanel from '../panels/SearchPanel'
import InboxPanel from '../panels/InboxPanel'
import ThreadsPanel from '../panels/ThreadsPanel'
import { useStore } from '../../store/useStore'

function RightPanel() {
  const rightPanel = useStore(s => s.rightPanel)
  if (!rightPanel) return null
  return (
    <div className="w-64 flex-shrink-0 border-l border-white/10 flex flex-col overflow-hidden backdrop-blur-sm">
      {rightPanel === 'members' && <MembersPanel />}
      {rightPanel === 'search'  && <SearchPanel />}
      {rightPanel === 'inbox'   && <InboxPanel />}
      {rightPanel === 'threads' && <ThreadsPanel />}
    </div>
  )
}

export default function AppLayout() {
  const selectedServerId = useStore(s => s.selectedServerId)

  return (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a0b2e 50%, #0f1729 100%)' }}>
      <TopNav />
      <div className="flex-1 min-h-0 overflow-hidden">
        {!selectedServerId ? (
          <HomeView />
        ) : (
          <div className="flex h-full">
            <ChannelList />
            <ChatArea />
            <RightPanel />
          </div>
        )}
      </div>
    </div>
  )
}
