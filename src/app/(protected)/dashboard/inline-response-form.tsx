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

const FAMILY_OPTIONS = [
  { value: 'safe',           label: '無事' },
  { value: 'injured',        label: '負傷' },
  { value: 'need_rescue',    label: '救助必要' },
  { value: 'checking',       label: '確認中' },
  { value: 'not_applicable', label: '確認不要' },
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
      <legend className="text-sm font-semibold text-gray-700 mb-1.5">
        {legend}<span className="text-red-500 ml-1">*</span>
      </legend>
      <div className="flex rounded-none overflow-hidden border border-gray-200 divide-x divide-gray-200">
        {options.map(({ value, label }) => (
          <label
            key={value}
            className={cn(
              'flex-1 flex items-center justify-center text-center py-2.5 px-1 text-[11px] font-medium cursor-pointer leading-snug transition-colors',
              'text-gray-500 bg-white hover:bg-gray-50',
              'has-[:checked]:bg-gray-700 has-[:checked]:text-white has-[:checked]:font-bold',
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

  const t = isDrill
    ? { val: 'text-amber-950', muted: 'text-amber-900/65', border: 'border-amber-700/40' }
    : { val: 'text-white',     muted: 'text-white/65',     border: 'border-white/35'     }

  return (
    <div>
      {/* カラーブロック：全情報 */}
      <div className={cn('px-4 pt-5 pb-4', isDrill ? 'bg-amber-400' : 'bg-red-600')}>

        {/* 種別・警告 */}
        <p className={cn('text-sm font-bold mb-0.5', t.val)}>
          {isDrill ? '避難訓練発報' : '本番発報'}
        </p>
        <p className={cn('text-xs font-semibold mb-4', t.muted)}>
          {isDrill ? 'これは避難訓練です' : 'これは訓練ではありません'}
        </p>

        {/* 中段：震度（左）＋ 発報者/日時（右） */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            {event.max_intensity != null ? (
              <>
                <p className={cn('text-[10px] font-semibold', t.muted)}>最大震度</p>
                <p className={cn('font-black leading-none tracking-tighter', t.val)}
                   style={{ fontSize: 'clamp(4rem, 20vw, 6rem)' }}>
                  {formatIntensity(event.max_intensity)}
                </p>
                {event.epicenter && (
                  <p className={cn('text-lg font-bold mt-1', t.val)}>{event.epicenter}</p>
                )}
              </>
            ) : !event.comment ? (
              <p className={cn('text-base font-bold', t.val)}>安否確認を行ってください</p>
            ) : null}
          </div>
          <div className={cn('text-right text-xs shrink-0', t.muted)}>
            <p className="font-medium">{event.issuer ?? '自動'}</p>
            <p className="mt-0.5 tabular-nums">{formatDateTimeFull(event.issued_at)}</p>
          </div>
        </div>

        {/* 特記事項（手動発報のコメント） */}
        {event.comment && (
          <p className={cn('text-sm mb-3', t.val)}>
            <span className={cn('text-xs', t.muted)}>特記事項：</span>{event.comment}
          </p>
        )}

        {/* 警告文（右下） */}
        <div className="flex justify-end mt-2">
          <p className={cn('text-sm font-bold', t.muted)}>
            ※ {isDrill ? 'これは避難訓練です' : 'これは訓練ではありません'}
          </p>
        </div>
      </div>

      {/* 回答フォーム */}
      <div className="bg-white px-4 py-5 space-y-4">
        <form action={formAction} className="space-y-4">
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
