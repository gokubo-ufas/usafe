'use client'

import { useActionState, useRef, useState } from 'react'
import { ConfirmModal } from '@/components/confirm-modal'
import { dispatchDrill, dispatchProduction } from './actions'
import { cn } from '@/lib/cn'

type Mode = 'drill' | 'production'
type State = { error?: string }
const INIT: State = {}

const MODES = [
  {
    id:          'drill'  as Mode,
    emoji:       '🟡',
    label:       '避難訓練',
    sublabel:    '訓練目的の発報',
    description: '訓練目的の安否確認を全社員に発報します。',
    note:        null,
    placeholder: '訓練の目的や注意事項を入力してください',
    btnLabel:    '避難訓練を発報する',
    btnClass:    'bg-amber-400 hover:bg-amber-500 text-amber-900',
    ringClass:   'focus:ring-amber-400',
    borderSel:   'border-amber-400 bg-amber-50',
    borderIdle:  'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/40',
    confirmTitle: '避難訓練の確認',
    confirmMsg:  '全社員に避難訓練の安否確認を発報します。\nよろしいですか？',
    confirmVariant: 'warning' as const,
  },
  {
    id:          'production' as Mode,
    emoji:       '🔴',
    label:       '本番発報',
    sublabel:    '実際の緊急事態',
    description: '実際の緊急事態として全社員に安否確認を発報します。',
    note:        '地震発生から10分以上経過しても自動発報されない場合等に利用可能です。発報前に必ずホームと履歴を確認し、自動発報がされていないことを確認してください。',
    placeholder: '緊急事態の状況や対応指示を入力してください',
    btnLabel:    '本番発報する',
    btnClass:    'bg-red-600 hover:bg-red-700 text-white',
    ringClass:   'focus:ring-red-400',
    borderSel:   'border-red-400 bg-red-50',
    borderIdle:  'border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/40',
    confirmTitle: '本番発報の確認',
    confirmMsg:  '全社員（在籍中）に安否確認を発報します。\nこの操作は取り消せません。よろしいですか？',
    confirmVariant: 'danger' as const,
  },
]

export default function DispatchPage() {
  const [mode, setMode] = useState<Mode>('drill')
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const [drillState,  drillAction,  drillPending]  = useActionState(dispatchDrill,      INIT)
  const [prodState,   prodAction,   prodPending]   = useActionState(dispatchProduction,  INIT)

  const current       = MODES.find((m) => m.id === mode)!
  const isPending     = mode === 'drill' ? drillPending : prodPending
  const error         = mode === 'drill' ? drillState.error : prodState.error
  const canSubmit     = mode === 'drill' || agreed

  function handleConfirm() {
    setShowConfirm(false)
    if (!formRef.current) return
    const fd = new FormData(formRef.current)
    if (mode === 'drill') drillAction(fd)
    else                  prodAction(fd)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">手動発報</h1>
        <p className="text-sm text-gray-500 mt-0.5">発報種別を選択してください。</p>
      </div>

      {/* タブ切り替え（タブ変更時に同意チェックをリセット） */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setMode(m.id); setAgreed(false) }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all',
              mode === m.id
                ? m.id === 'drill'
                  ? 'bg-white shadow-sm text-amber-600'
                  : 'bg-white shadow-sm text-red-600'
                : 'text-gray-400 hover:text-gray-600',
            )}
          >
            <span>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* フォーム */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <p className="text-sm text-gray-700">{current.description}</p>
          {current.note && (
            <p className="text-xs text-gray-500 mt-1">{current.note}</p>
          )}
        </div>

        <form ref={formRef} className="space-y-4">
          <div>
            <label htmlFor="dispatch-comment" className="block text-sm font-semibold text-gray-700 mb-1.5">
              コメント <span className="font-normal text-gray-400">（任意・50文字以内）</span>
            </label>
            <textarea
              id="dispatch-comment"
              name="comment"
              rows={3}
              maxLength={50}
              placeholder={current.placeholder}
              className={cn(
                'w-full text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-shadow',
                current.ringClass,
              )}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {/* 本番発報のみ：同意チェック */}
          {mode === 'production' && (
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-red-600 shrink-0"
              />
              <span className="text-sm text-gray-700 leading-snug">
                ホームと履歴で自動発報がされていないことを確認しました。本番発報することに同意します。
              </span>
            </label>
          )}

          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={isPending || !canSubmit}
            className={cn(
              'w-full py-3 font-semibold rounded-xl disabled:opacity-40 transition-colors text-sm',
              current.btnClass,
            )}
          >
            {isPending ? '発報中…' : current.btnLabel}
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title={current.confirmTitle}
        message={current.confirmMsg}
        confirmLabel="発報する"
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        isPending={isPending}
        danger={current.confirmVariant === 'danger'}
        warning={current.confirmVariant === 'warning'}
      />
    </div>
  )
}
