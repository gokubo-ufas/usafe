'use client'

import { useActionState } from 'react'
import { submitResponse } from './actions'
import { cn } from '@/lib/cn'
import { formatDateTime, formatIntensity } from '@/lib/utils'
import type { Event } from '@/types'

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
  isDrill,
}: {
  name: string
  legend: string
  options: { value: string; label: string }[]
  isDrill: boolean
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-gray-800 mb-1.5">
        {legend}<span className="text-red-500 ml-1">*</span>
      </legend>
      <div className="flex rounded-xl overflow-hidden border border-gray-200 divide-x divide-gray-200">
        {options.map(({ value, label }) => (
          <label
            key={value}
            className={cn(
              'flex-1 flex items-center justify-center text-center py-2.5 px-1 text-[11px] font-medium cursor-pointer leading-snug transition-colors',
              'text-gray-500 bg-white hover:bg-gray-50',
              isDrill
                ? 'has-[:checked]:bg-amber-400 has-[:checked]:text-amber-950 has-[:checked]:font-bold'
                : 'has-[:checked]:bg-red-500 has-[:checked]:text-white has-[:checked]:font-bold',
            )}
          >
            <input type="radio" name={name} value={value} required className="sr-only" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function InlineResponseForm({ event }: { event: Event }) {
  const [state, formAction, isPending] = useActionState(submitResponse, INIT)
  const isDrill = event.event_type === 'test'

  return (
    <div className="space-y-3">
      {/* イベントコンテキスト */}
      <div className={cn(
        'rounded-2xl border px-4 py-3 space-y-1',
        isDrill ? 'bg-amber-100/60 border-amber-300' : 'bg-red-100/60 border-red-300',
      )}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'text-sm font-bold px-2.5 py-0.5 rounded-full',
            isDrill ? 'bg-amber-300 text-amber-950' : 'bg-red-300 text-red-950',
          )}>
            {isDrill ? '🟡 避難訓練' : '🔴 安否確認'}
          </span>
          <span className="text-xs text-gray-600 tabular-nums">{formatDateTime(event.issued_at)}</span>
        </div>
        {event.max_intensity != null && (
          <p className={cn('text-sm font-bold', isDrill ? 'text-amber-900' : 'text-red-900')}>
            最大震度{formatIntensity(event.max_intensity)}
            {event.epicenter ? `　${event.epicenter}` : ''}
          </p>
        )}
        {event.comment && (
          <p className="text-sm text-gray-700">{event.comment}</p>
        )}
        <p className="text-xs text-gray-500">発報者：{event.issuer ?? '自動'}</p>
      </div>

      {/* 回答フォーム */}
      <form action={formAction} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-4">
        <input type="hidden" name="event_id" value={event.event_id} />

        <RadioGroup name="self_status"   legend="本人の状況" options={SELF_OPTIONS}   isDrill={isDrill} />
        <RadioGroup name="family_status" legend="家族の状況" options={FAMILY_OPTIONS} isDrill={isDrill} />
        <RadioGroup name="work_status"   legend="業務対応"   options={WORK_OPTIONS}   isDrill={isDrill} />

        <div>
          <label htmlFor="inline-comment" className="block text-sm font-semibold text-gray-700 mb-1.5">
            コメント <span className="font-normal text-gray-400">（任意・50文字以内）</span>
          </label>
          <textarea
            id="inline-comment"
            name="comment"
            rows={2}
            maxLength={50}
            placeholder="状況を補足するコメントがあれば"
            className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'w-full py-3 text-sm font-bold rounded-xl transition-colors disabled:opacity-50',
            isDrill
              ? 'bg-amber-400 hover:bg-amber-500 text-amber-950'
              : 'bg-red-600 hover:bg-red-700 text-white',
          )}
        >
          {isPending ? '送信中…' : '安否を報告する'}
        </button>
      </form>
    </div>
  )
}
