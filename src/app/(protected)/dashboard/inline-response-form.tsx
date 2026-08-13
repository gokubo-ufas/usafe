'use client'

import { useActionState } from 'react'
import { submitResponse } from './actions'
import { cn } from '@/lib/cn'
import { formatDateTimeFull, formatIntensity } from '@/lib/utils'
import type { Event } from '@/types'

type State = { error?: string }
const INIT: State = {}

const SELF_OPTIONS = [
  { value: 'safe',        label: '無事' },
  { value: 'injured',     label: '負傷' },
  { value: 'need_rescue', label: '救助必要' },
]

const FAMILY_ROWS = [
  [
    { value: 'safe',        label: '無事' },
    { value: 'injured',     label: '負傷' },
    { value: 'need_rescue', label: '救助必要' },
  ],
  [
    { value: 'not_applicable', label: '確認不要' },
    { value: 'checking',       label: '確認中' },
  ],
]

const WORK_OPTIONS = [
  { value: 'available',   label: '対応可能' },
  { value: 'unavailable', label: '対応困難' },
]

const LABEL_CLASS = cn(
  'flex-1 flex items-center justify-center text-center py-5 px-1 text-xs font-medium cursor-pointer leading-snug transition-colors',
  'text-gray-500 bg-white hover:bg-gray-50',
  'has-[:checked]:bg-gray-700 has-[:checked]:text-white has-[:checked]:font-bold',
)

function RadioGroup({
  name,
  legend,
  options,
  rows,
}: {
  name: string
  legend: string
  options?: { value: string; label: string }[]
  rows?: { value: string; label: string }[][]
}) {
  const renderRow = (row: { value: string; label: string }[]) =>
    row.map(({ value, label }) => (
      <label key={value} className={LABEL_CLASS}>
        <input type="radio" name={name} value={value} required className="sr-only" />
        {label}
      </label>
    ))

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-gray-700 mb-1.5">
        {legend}<span className="text-red-500 ml-1">*</span>
      </legend>
      <div className="border border-gray-200">
        {rows
          ? rows.map((row, i) => (
              <div key={i} className={cn('flex divide-x divide-gray-200', i > 0 && 'border-t border-gray-200')}>
                {renderRow(row)}
              </div>
            ))
          : <div className="flex divide-x divide-gray-200">{renderRow(options ?? [])}</div>
        }
      </div>
    </fieldset>
  )
}

export function InlineResponseForm({ event, answeredCount, totalCount }: { event: Event; answeredCount: number; totalCount: number }) {
  const [state, formAction, isPending] = useActionState(submitResponse, INIT)
  const isDrill = event.event_type === 'test'

  return (
    <div>
      {/* カラーブロック：全情報 */}
      <div className={cn('px-4 pt-5 pb-4 text-sm font-bold text-white', isDrill ? 'bg-amber-400' : 'bg-red-600')}>

        {/* 震度（左）＋ 回答数・発報情報（右） */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {event.max_intensity != null ? (
              <>
                <p className="tracking-[0.15em] uppercase mb-0.5">最大震度</p>
                <p className="font-black leading-none tracking-tighter"
                   style={{ fontSize: 'clamp(4rem, 20vw, 6rem)' }}>
                  {formatIntensity(event.max_intensity)}
                </p>
                {event.epicenter && (
                  <p className="text-2xl mt-1.5">
                    <span className="text-sm mr-1">震源地：</span>
                    {event.epicenter}
                  </p>
                )}
              </>
            ) : !event.comment ? (
              <p>安否確認を行ってください</p>
            ) : null}
          </div>
          <div className="text-right shrink-0">
            <p className="mb-3">{answeredCount} / {totalCount}名 回答済み</p>
            <p className="tabular-nums leading-relaxed">
              {formatDateTimeFull(event.issued_at)}<br />
              発報（{event.issuer ?? '自動発報'}）
            </p>
          </div>
        </div>

        {/* 特記事項（常時表示） */}
        <p className="leading-relaxed">
          <span className="tracking-[0.1em] uppercase mr-2">特記事項</span>
          {event.comment ?? '—'}
        </p>
      </div>

      {/* 回答フォーム */}
      <div className="bg-white px-4 py-5 space-y-4">
        {/* 警告文 */}
        <p className={cn('text-xs font-bold text-right', isDrill ? 'text-amber-600' : 'text-red-600')}>
          ※ {isDrill ? 'これは避難訓練です' : 'これは訓練ではありません'}
        </p>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="event_id" value={event.event_id} />

          <RadioGroup name="self_status"   legend="本人の状況" options={SELF_OPTIONS} />
          <RadioGroup name="family_status" legend="家族の状況" rows={FAMILY_ROWS} />
          <RadioGroup name="work_status"   legend="業務対応"   options={WORK_OPTIONS} />

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
              className="w-full text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-none px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-none px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'w-full py-3.5 text-sm font-bold rounded-none transition-colors disabled:opacity-50',
              isDrill
                ? 'bg-amber-400 hover:bg-amber-500 text-amber-950'
                : 'bg-red-500 hover:bg-red-600 text-white',
            )}
          >
            {isPending ? '送信中…' : '安否を報告する'}
          </button>
        </form>
      </div>
    </div>
  )
}
