import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="modal-enter pointer-events-auto w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <Dialog.Title className="text-base font-700 text-white">{title}</Dialog.Title>
                {description && (
                  <Dialog.Description className="text-xs font-400 text-white/60 mt-0.5">{description}</Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <button className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors cursor-pointer">
                  <X size={15} />
                </button>
              </Dialog.Close>
            </div>
            {/* Body */}
            <div className="p-6">{children}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* Shared input style used inside modals */
export function ModalInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3',
        'text-sm font-500 text-white placeholder:text-white/40',
        'outline-none focus:border-blue-400/50 focus:bg-white/8 transition-all caret-blue-400',
        props.className ?? '',
      ].join(' ')}
    />
  )
}

/* Primary action button */
export function ModalBtn({
  children, onClick, disabled, danger,
}: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-xl text-sm font-700 text-white transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
      style={{ background: danger ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)', boxShadow: danger ? '0 0 20px rgba(239,68,68,0.3)' : '0 0 20px rgba(59,130,246,0.3)' }}
    >
      {children}
    </button>
  )
}
