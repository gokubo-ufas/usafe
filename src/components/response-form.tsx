'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { submitResponse } from '@/app/(protected)/dashboard/actions'
import type { Response } from '@/types'

type State = { error?: string }
const INIT: State = {}

const SELF_OPTIONS = [
  { value: 'safe',        label: '無事' },
  { value: 'injured',     label: '負傷' },
  { value: 'need_rescue', label: '救助が必要' },
]

const FAMILY_OPTIONS = [
  { value: 'safe',           label: '無事' },
  { value: 'injured',        label: '負傷' },
  { value: 'need_rescue',    label: '救助が必要' },
  { value: 'checking',       label: '安否確認中' },
  { value: 'not_applicable', label: '対象家族なし' },
]

const WORK_OPTIONS = [
  { value: 'available',   label: '対応可能' },
  { value: 'unavailable', label: '対応困難' },
]

function RadioGroup({
  name,
  legend,
  options,
  defaultValue,
}: {
  name: string
  legend: string
  options: { value: string; label: string }[]
  defaultValue?: string | null
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-gray-700 mb-1.5">
        {legend}<span className="text-red-500 ml-1">*</span>
      </legend>
      <div className="flex rounded-xl overflow-hidden border border-gray-200 divide-x divide-gray-200">
        {options.map(({ value, label }) => (
          <label
            key={value}
            className="flex-1 flex items-center justify-center text-center py-2.5 px-1 text-[11px] font-medium cursor-pointer leading-snug transition-colors text-gray-500 bg-white hover:bg-gray-50 has-[:checked]:bg-emerald-600 has-[:checked]:text-white has-[:checked]:font-bold"
          >
            <input
              type="radio"
              name={name}
              value={value}
              required
              defaultChecked={defaultValue === value}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ModalForm({
  eventId,
  current,
  onClose,
}: {
  eventId: string
  current: Response | null
  onClose: () => void
}) {
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
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xs max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">安否報告</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="閉じる"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={formAction} className="overflow-y-auto flex-1 px-5 py-3 space-y-4">
          <input type="hidden" name="event_id" value={eventId} />
          <RadioGroup name="self_status"   legend="本人の状況" options={SELF_OPTIONS}   defaultValue={current?.self_status}   />
          <RadioGroup name="family_status" legend="家族の状況" options={FAMILY_OPTIONS} defaultValue={current?.family_status} />
          <RadioGroup name="work_status"   legend="業務対応"   options={WORK_OPTIONS}   defaultValue={current?.work_status}   />

          <div>
            <label htmlFor="resp-comment" className="block text-sm font-semibold text-gray-700 mb-1.5">
              コメント <span className="font-normal text-gray-400">（任意・50文字以内）</span>
            </label>
            <textarea
              id="resp-comment"
              name="comment"
              rows={2}
              maxLength={50}
              defaultValue={current?.comment ?? ''}
              placeholder="状況を補足するコメントがあれば"
              className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {state.error}
            </p>
          )}

          <div className="flex gap-3 pb-1">
            <button type="button" onClick={onClose} disabled={isPending}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors">
              キャンセル
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 disabled:opacity-50 transition-colors">
              {isPending ? '送信中…' : '送信する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ResponseForm({
  eventId,
  hasAnswered,
  currentResponse,
}: {
  eventId: string
  hasAnswered: boolean
  currentResponse: Response | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-xl hover:bg-emerald-800 transition-colors"
      >
        {hasAnswered ? '回答を更新する' : '安否を報告する'}
      </button>
      {open && (
        <ModalForm eventId={eventId} current={currentResponse} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
