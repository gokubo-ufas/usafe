'use client'

import { useActionState, useRef, useState } from 'react'
import { ConfirmModal } from '@/components/confirm-modal'
import { dispatchManualAlert } from './actions'

type State = { error?: string }
const INIT: State = {}

export default function ManualPage() {
  const [state, dispatch, isPending] = useActionState(dispatchManualAlert, INIT)
  const [showConfirm, setShowConfirm] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function handleConfirm() {
    setShowConfirm(false)
    if (formRef.current) dispatch(new FormData(formRef.current))
  }

  return (
    <>
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-red-100">
          <h1 className="text-xl font-bold text-red-700 mb-1">本番発報</h1>
          <p className="text-sm text-gray-600 mb-1">
            全社員に安否確認を発報します。
          </p>
          <p className="text-sm font-medium text-red-600 mb-6">
            訓練目的の場合は「テスト発報」を使用してください。
          </p>

          <form ref={formRef} className="space-y-4">
            <div>
              <label htmlFor="manual-comment" className="block text-sm font-medium text-gray-700 mb-1">
                コメント（任意・50文字以内）
              </label>
              <textarea
                id="manual-comment"
                name="comment"
                rows={3}
                maxLength={50}
                placeholder="緊急事態の状況や指示を入力してください"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            {state.error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
            )}

            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={isPending}
              className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isPending ? '発報中…' : '本番発報する'}
            </button>
          </form>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="本番発報の確認"
        message={`全社員（在籍中）に安否確認を発報します。\nこの操作は取り消せません。よろしいですか？`}
        confirmLabel="発報する"
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        isPending={isPending}
        danger
      />
    </>
  )
}
