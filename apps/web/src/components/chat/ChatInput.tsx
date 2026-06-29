import { useState, useRef, type KeyboardEvent } from 'react'
import { Paperclip, Smile, ImageIcon, Sticker, SendHorizonal } from 'lucide-react'
import clsx from 'clsx'
import { IconButton } from '../ui/IconButton'
import { useStore } from '../../store/useStore'
import { ws } from '../../lib/ws'

export default function ChatInput() {
  const [value, setValue]         = useState('')
  const [isSending, setIsSending] = useState(false)
  const sendMessage               = useStore(s => s.sendMessage)
  const channels                  = useStore(s => s.channels)
  const selectedId                = useStore(s => s.selectedChannelId)
  const typingTimer               = useRef<ReturnType<typeof setTimeout> | null>(null)

  const ch = channels.find(c => c.id === selectedId)

  const submit = async () => {
    const trimmed = value.trim()
    if (!trimmed || isSending) return
    setValue('')
    setIsSending(true)
    try { await sendMessage(trimmed) }
    finally { setIsSending(false) }
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
      <div className={clsx(
        'flex items-center gap-1.5 rounded-2xl backdrop-blur-xl transition-all duration-300 px-3 py-1.5',
        'bg-white/5 border border-white/10 hover:border-white/20',
        value && 'border-blue-400/40 bg-white/8 shadow-lg shadow-blue-400/10',
      )}>
        <IconButton icon={Paperclip} label="Attach file" size={15} side="top" />

        <input
          type="text"
          value={value}
          onChange={e => onInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isSending}
          placeholder={ch ? `Message #${ch.name}` : 'Select a channel…'}
          className="flex-1 bg-transparent border-none outline-none text-[13.5px] font-400 text-bright placeholder:text-white/35 py-3.5 caret-accent disabled:opacity-50"
          style={{ fontFamily: 'var(--font-sans)' }}
        />

        <div className="flex items-center gap-0.5">
          <IconButton icon={Smile}     label="Emoji"    size={15} side="top" />
          <IconButton icon={ImageIcon} label="GIF"      size={15} side="top" />
          <IconButton icon={Sticker}   label="Stickers" size={15} side="top" />

          {value.trim() && (
            <button
              onClick={submit}
              disabled={isSending}
              className="w-8 h-8 rounded-xl flex items-center justify-center ml-1 transition-all duration-150 cursor-pointer disabled:opacity-50 text-white hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', boxShadow: '0 0 15px rgba(59,130,246,0.4)' }}
            >
              <SendHorizonal size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
