'use client'

import { useActionState } from 'react'
import { syncEmployeesAction, type SyncActionState } from './actions'

export function SyncForm() {
  const [state, dispatch, isPending] = useActionState<SyncActionState, FormData>(
    syncEmployeesAction,
    null
  )

  return (
    <form action={dispatch} className="space-y-4">
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? '同期中...' : '社員マスタを同期'}
      </button>
      {state !== null && (
        <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>
          {state.success
            ? `社員マスタを最新化しました。取得社員数：${state.count}名`
            : `社員マスタの最新化に失敗しました。既存の社員マスタは変更されていません。`}
        </p>
      )}
    </form>
  )
}
