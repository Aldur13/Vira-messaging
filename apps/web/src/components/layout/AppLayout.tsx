import ServerList from '../servers/ServerList'
import ChannelList from '../channels/ChannelList'
import ChatArea from '../chat/ChatArea'
import MemberList from '../members/MemberList'

export default function AppLayout() {
  return (
    <div className="flex h-full overflow-hidden bg-deep">
      <ServerList />
      <ChannelList />
      <ChatArea />
      <MemberList />
    </div>
  )
}
