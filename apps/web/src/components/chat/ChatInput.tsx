import { useState, useRef, type KeyboardEvent } from 'react'
import { Paperclip, Smile, ImageIcon, Sticker } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { useStore } from '../../store/useStore'
import { ws } from '../../lib/ws'

export default function ChatInput() {
  const [value, setValue]   = useState('')
  const [isSending, setIsSending] = useState(false)
  const sendMessage         = useStore(s => s.sendMessage)
  const channels            = useStore(s => s.channels)
  const selectedId          = useStore(s => s.selectedChannelId)
  const typingTimer         = useRef<ReturnType<typeof setTimeout> | null>(null)

  const ch = channels.find(c => c.id === selectedId)

  const submit = async () => {
    const trimmed = value.trim()
    if (!trimmed || isSending) return
    setValue('')
    setIsSending(true)
    try {
      await sendMessage(trimmed)
    } finally {
      setIsSending(false)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const onInput = (v: string) => {
    setValue(v)
    if (!selectedId) return
    ws.typing(selectedId, true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => ws.typing(selectedId, false), 2000)
  }

  return (
    <div className="px-4 pb-4 pt-2 flex-shrink-0">
      <div className="flex items-center gap-1.5 bg-high rounded-xl border border-white/6 hover:border-accent/30 focus-within:border-accent/40 transition-colors duration-200 px-3">
        <IconButton icon={Paperclip} label="Attach file" size={16} side="top" />
        <input
          type="text"
          value={value}
          onChange={e => onInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isSending}
          placeholder={ch ? `Message #${ch.name} (encrypted)` : 'Select a channel'}
          className="flex-1 bg-transparent border-none outline-none text-[13.5px] font-400 text-bright placeholder:text-ghost py-3 caret-accent disabled:opacity-50"
          style={{ fontFamily: 'var(--font-sans)' }}
        />
        <div className="flex items-center gap-0.5">
          <IconButton icon={Smile}     label="Emoji"    size={16} side="top" />
          <IconButton icon={ImageIcon} label="GIF"      size={16} side="top" />
          <IconButton icon={Sticker}   label="Stickers" size={16} side="top" />
        </div>
      </div>
    </div>
  )
}
