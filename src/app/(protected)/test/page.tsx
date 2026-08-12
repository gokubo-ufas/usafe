'use client'

import { useActionState } from 'react'
import { dispatchTestAlert } from './actions'

type State = { error?: string }
const INIT: State = {}

export default function TestPage() {
  const [state, formAction, isPending] = useActionState(dispatchTestAlert, INIT)

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">テスト発報</h1>
        <p className="text-sm text-gray-500 mb-6">
          訓練目的の安否確認を全社員に発報します。実際の緊急事態ではありません。
        </p>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="test-comment" className="block text-sm font-medium text-gray-700 mb-1">
              コメント（任意・50文字以内）
            </label>
            <textarea
              id="test-comment"
              name="comment"
              rows={3}
              maxLength={50}
              placeholder="訓練の目的や注意事項を入力してください"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-800 disabled:opacity-50 transition-colors text-sm"
          >
            {isPending ? '発報中…' : 'テスト発報する'}
          </button>
        </form>
      </div>
    </div>
  )
}
