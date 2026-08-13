'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/cn'

type Props = {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
  isPending?: boolean
  danger?: boolean
  warning?: boolean
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  isPending,
  danger,
  warning,
}: Props) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h2 className="font-bold text-white mb-3 text-base">{title}</h2>
        <p className="text-sm text-white/60 mb-6 whitespace-pre-line leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm text-white/50 hover:text-white/80 disabled:opacity-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50',
              danger   ? 'bg-red-500    text-white hover:bg-red-400' :
              warning  ? 'bg-amber-500  text-white hover:bg-amber-400' :
                         'bg-emerald-600 text-white hover:bg-emerald-500',
            )}
          >
            {isPending ? '処理中...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
