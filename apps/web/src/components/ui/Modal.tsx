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
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="modal-enter pointer-events-auto w-full max-w-md bg-surface border border-white/10 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <div>
                <Dialog.Title className="text-base font-700 text-ink-100">{title}</Dialog.Title>
                {description && (
                  <Dialog.Description className="text-xs font-400 text-ink-400 mt-0.5">{description}</Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <button className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-raised transition-colors cursor-pointer">
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
        'w-full bg-raised border border-white/10 rounded-xl px-4 py-3',
        'text-sm font-500 text-ink-100 placeholder:text-ink-600',
        'outline-none focus:border-brand/50 transition-colors caret-brand',
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
      style={{ background: danger ? 'linear-gradient(135deg,#f87171,#ef4444)' : 'linear-gradient(135deg,#06d6a0,#818cf8)' }}
    >
      {children}
    </button>
  )
}
