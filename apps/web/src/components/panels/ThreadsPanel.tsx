import { useState } from 'react'
import { X, Send } from 'lucide-react'
import { Lock } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Avatar } from '../ui/Avatar'
import MessageGroup from '../chat/MessageGroup'

export default function ThreadsPanel() {
  const openThreadId = useStore(s => s.openThreadId)
  const threadMessages = useStore(s => s.threadMessages)
  const messages = useStore(s => s.messages)
  const members = useStore(s => s.members)
  const closeThread = useStore(s => s.closeThread)
  const replyToMessage = useStore(s => s.replyToMessage)
  const [replyText, setReplyText] = useState('')

  if (!openThreadId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 gap-4 px-5 text-center backdrop-blur-sm"
           style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
             style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <svg className="w-6 h-6 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-700 text-white mb-1">Threads</p>
          <p className="text-xs text-white/60 leading-relaxed">
            Reply to messages to start a thread.
          </p>
        </div>
      </div>
    )
  }

  const parentMsg = messages.find(m => m.id === openThreadId)
  const parentMember = parentMsg ? members.find(m => m.userId === parentMsg.authorId) : null

  const handleReply = async () => {
    if (!replyText.trim()) return
    await replyToMessage(openThreadId, replyText)
    setReplyText('')
  }

  return (
    <div className="flex flex-col h-full backdrop-blur-sm" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-700 text-white">Thread</h2>
          <button
            onClick={closeThread}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X size={16} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
        {/* Parent message */}
        {parentMsg && parentMember && (
          <div className="border-l-2 border-blue-400/30 pl-3 py-2 mb-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[13px] font-700 text-white">{parentMsg.author?.username}</span>
              <span className="text-[10px] font-400 text-white/50">{parentMsg.timestamp}</span>
            </div>
            <div className="text-[13px] font-400 text-white/80">
              {parentMsg.isEncrypted ? (
                <>
                  <Lock size={9} className="inline mr-1 text-cyan-400" />
                  {parentMsg.decryptedContent || parentMsg.content}
                </>
              ) : (
                parentMsg.content
              )}
            </div>
          </div>
        )}

        {/* Replies */}
        {threadMessages.length === 0 ? (
          <p className="text-[12px] text-white/50 italic text-center py-4">No replies yet</p>
        ) : (
          threadMessages.map(msg => {
            const member = members.find(m => m.userId === msg.authorId)
            if (!member) return null
            return (
              <div key={msg.id} className="text-[12px] mb-2">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <Avatar user={member.user} size="xs" />
                  <span className="text-[12px] font-700 text-white">{msg.author?.username}</span>
                  <span className="text-[9px] text-white/50">{msg.timestamp}</span>
                </div>
                <div className="text-[12px] text-white/80 ml-5">
                  {msg.decryptedContent || msg.content}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Reply input */}
      <div className="px-3 py-3 border-t border-white/10 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleReply()}
            placeholder="Reply in thread..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white placeholder-white/40 outline-none focus:bg-white/8 focus:border-white/20 transition-all"
          />
          <button
            onClick={handleReply}
            disabled={!replyText.trim()}
            className="p-2 hover:bg-blue-400/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send size={14} className="text-blue-300" />
          </button>
        </div>
      </div>
    </div>
  )
}
