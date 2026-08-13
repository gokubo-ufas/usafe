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
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="font-bold text-gray-900 mb-3 text-base">{title}</h2>
        <p className="text-sm text-gray-600 mb-6 whitespace-pre-line leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50',
              danger   ? 'bg-red-500    text-white hover:bg-red-600'   :
              warning  ? 'bg-amber-400  text-amber-950 hover:bg-amber-500' :
                         'bg-emerald-700 text-white hover:bg-emerald-800',
            )}
          >
            {isPending ? '処理中...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
