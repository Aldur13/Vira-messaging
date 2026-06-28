import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

export default function ChatArea() {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-mid">
      <ChatHeader />
      <MessageList />
      <ChatInput />
    </div>
  )
}
