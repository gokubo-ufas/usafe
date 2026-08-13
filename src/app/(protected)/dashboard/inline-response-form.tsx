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

export function InlineResponseForm({ event }: { event: Event }) {
  const [state, formAction, isPending] = useActionState(submitResponse, INIT)
  const isDrill = event.event_type === 'test'

  const t = isDrill
    ? { val: 'text-amber-950', muted: 'text-amber-900/65', border: 'border-amber-700/40' }
    : { val: 'text-white',     muted: 'text-white/65',     border: 'border-white/35'     }

  return (
    <div>
      {/* カラーブロック：全情報 */}
      <div className={cn('px-4 pt-5 pb-4', isDrill ? 'bg-amber-400' : 'bg-red-600')}>

        {/* 中段：震度（左）＋ 発報者/日時（右） */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            {event.max_intensity != null ? (
              <>
                <p className={cn('text-[9px] font-bold tracking-[0.15em] uppercase mb-0.5', t.muted)}>最大震度</p>
                <p className={cn('font-black leading-none tracking-tighter', t.val)}
                   style={{ fontSize: 'clamp(4rem, 20vw, 6rem)' }}>
                  {formatIntensity(event.max_intensity)}
                </p>
                {event.epicenter && (
                  <p className={cn('text-xl font-bold mt-1.5', t.val)}>{event.epicenter}</p>
                )}
              </>
            ) : !event.comment ? (
              <p className={cn('text-lg font-bold', t.val)}>安否確認を行ってください</p>
            ) : null}
          </div>
          <div className={cn('text-right text-[10px] shrink-0 space-y-0.5', t.muted)}>
            <p className="font-semibold text-xs">{event.issuer ?? '自動'}</p>
            <p className="tabular-nums">{formatDateTimeFull(event.issued_at)}</p>
          </div>
        </div>

        {/* 特記事項（手動発報のコメント） */}
        {event.comment && (
          <p className={cn('text-sm mb-4 leading-relaxed', t.val)}>
            <span className={cn('text-[9px] font-bold tracking-[0.1em] uppercase mr-1', t.muted)}>特記事項</span>
            {event.comment}
          </p>
        )}

        {/* 警告文（右下） */}
        <div className="flex justify-end mt-1">
          <p className={cn('text-sm font-bold tracking-wide', t.muted)}>
            ※ {isDrill ? 'これは避難訓練です' : 'これは訓練ではありません'}
          </p>
        </div>
      </div>

      {/* 回答フォーム */}
      <div className="bg-white px-4 py-5 space-y-4">
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
