'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { submitResponse } from './actions'

type State = { error?: string }
const INIT: State = {}

function ModalForm({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(submitResponse, INIT)
  const wasSubmitting = useRef(false)

  useEffect(() => {
    if (wasSubmitting.current && !isPending && !state.error) onClose()
    wasSubmitting.current = isPending
  }, [isPending, state.error, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-5">安否報告</h2>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="event_id" value={eventId} />

          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              本人の状況 <span className="text-red-500">*</span>
            </legend>
            <div className="space-y-1">
              {[
                { value: 'safe', label: '無事' },
                { value: 'injured', label: '負傷' },
                { value: 'need_rescue', label: '救助が必要' },
              ].map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 cursor-pointer px-2 py-2 rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="self_status"
                    value={value}
                    required
                    className="w-4 h-4 accent-emerald-700"
                  />
                  <span className="text-sm text-gray-800">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              家族の状況 <span className="text-red-500">*</span>
            </legend>
            <div className="space-y-1">
              {[
                { value: 'safe', label: '無事' },
                { value: 'injured', label: '負傷' },
                { value: 'need_rescue', label: '救助が必要' },
                { value: 'checking', label: '安否確認中' },
                { value: 'not_applicable', label: '対象家族なし' },
              ].map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 cursor-pointer px-2 py-2 rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="family_status"
                    value={value}
                    required
                    className="w-4 h-4 accent-emerald-700"
                  />
                  <span className="text-sm text-gray-800">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              業務対応 <span className="text-red-500">*</span>
            </legend>
            <div className="space-y-1">
              {[
                { value: 'available', label: '対応可能' },
                { value: 'unavailable', label: '対応困難' },
              ].map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 cursor-pointer px-2 py-2 rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="work_status"
                    value={value}
                    required
                    className="w-4 h-4 accent-emerald-700"
                  />
                  <span className="text-sm text-gray-800">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="resp-comment" className="block text-sm font-medium text-gray-700 mb-1">
              コメント（任意・50文字以内）
            </label>
            <textarea
              id="resp-comment"
              name="comment"
              rows={2}
              maxLength={50}
              placeholder="状況を補足するコメント"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 text-sm font-semibold bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 disabled:opacity-50 transition-colors"
            >
              {isPending ? '送信中…' : '送信する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ResponseForm({ eventId, hasAnswered }: { eventId: string; hasAnswered: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-800 transition-colors text-sm"
      >
        {hasAnswered ? '回答を更新する' : '安否を報告する'}
      </button>
      {open && <ModalForm eventId={eventId} onClose={() => setOpen(false)} />}
    </>
  )
}
