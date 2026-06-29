import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

export default function ChatArea() {
  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a0b2e 50%, #0f1729 100%)' }}>
      <ChatHeader />
      <MessageList />
      <ChatInput />
    </div>
  )
}
