import { useState } from 'react'
import { Plus, MessageCircle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Avatar } from '../ui/Avatar'

export default function DMList() {
  const dmConversations = useStore(s => s.dmConversations)
  const members = useStore(s => s.members)
  const selectedChannelId = useStore(s => s.selectedChannelId)
  const selectChannel = useStore(s => s.selectChannel)
  const startDM = useStore(s => s.startDM)
  const [showNewDM, setShowNewDM] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const availableUsers = members.filter(m => !dmConversations.some(dm => dm.recipientId === m.userId))

  const handleStartDM = async (userId: string) => {
    await startDM(userId)
    setShowNewDM(false)
    setSelectedUser(null)
  }

  return (
    <div className="flex flex-col h-full bg-shade">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-high/20">
        <h2 className="text-sm font-700 text-bright">Direct Messages</h2>
        <button
          onClick={() => setShowNewDM(!showNewDM)}
          className="p-1.5 hover:bg-high/20 rounded transition-colors"
          title="New DM"
        >
          <Plus size={18} className="text-ghost" />
        </button>
      </div>

      {/* New DM dropdown */}
      {showNewDM && (
        <div className="px-2 py-2 bg-high/20 border-b border-high/20">
          <div className="text-[11px] font-600 text-ghost mb-2 px-2">Start conversation with</div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {availableUsers.length === 0 ? (
              <p className="text-[12px] text-ghost px-2 py-2">No available users</p>
            ) : (
              availableUsers.map(m => (
                <button
                  key={m.userId}
                  onClick={() => handleStartDM(m.userId)}
                  className="w-full text-left px-2 py-2 rounded text-[12px] hover:bg-high/30 transition-colors flex items-center gap-2"
                >
                  <Avatar user={m.user} size="xs" />
                  <span className="text-soft">{m.user.username}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* DM conversations */}
      <div className="flex-1 overflow-y-auto space-y-1 p-2">
        {dmConversations.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <MessageCircle size={24} className="text-ghost/40 mx-auto mb-2" />
            <p className="text-[12px] text-ghost">No conversations yet</p>
          </div>
        ) : (
          dmConversations.map(dm => {
            const user = members.find(m => m.userId === dm.recipientId)?.user
            if (!user) return null

            const isSelected = selectedChannelId === dm.id

            return (
              <button
                key={dm.id}
                onClick={() => selectChannel(dm.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  isSelected ? 'bg-accent/20' : 'hover:bg-high/20'
                }`}
              >
                <Avatar user={user} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-600 text-bright truncate">{user.username}</div>
                  {dm.lastMessageTime && (
                    <div className="text-[10px] text-ghost truncate">
                      {new Date(dm.lastMessageTime).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
