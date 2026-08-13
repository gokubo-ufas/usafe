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

  const tc = isDrill
    ? { title: 'text-amber-950', sub: 'text-amber-900/70', label: 'text-amber-900/60', big: 'text-amber-950', body: 'text-amber-900' }
    : { title: 'text-white',     sub: 'text-white/75',     label: 'text-white/60',     big: 'text-white',     body: 'text-white'     }

  return (
    <div>
      {/* カラーブロック：全情報 */}
      <div className={cn('px-4 pt-5 pb-5 space-y-3', isDrill ? 'bg-amber-400' : 'bg-red-600')}>

        {/* 種別・日時・警告 */}
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn('text-sm font-bold', tc.title)}>
              {isDrill ? '避難訓練発報' : '本番発報'}
            </span>
            <span className={cn('text-xs tabular-nums', tc.sub)}>
              {formatDateTime(event.issued_at)}
            </span>
          </div>
          <p className={cn('text-xs font-semibold mt-0.5', tc.sub)}>
            {isDrill ? 'これは避難訓練です' : 'これは訓練ではありません'}
          </p>
        </div>

        {/* 地震情報 */}
        {event.max_intensity != null && (
          <div>
            <p className={cn('text-[10px] font-semibold tracking-wide', tc.label)}>最大震度</p>
            <p className={cn('font-black leading-none tracking-tighter', tc.big)}
               style={{ fontSize: 'clamp(4rem, 20vw, 6rem)' }}>
              {formatIntensity(event.max_intensity)}
            </p>
            {event.epicenter && (
              <p className={cn('text-lg font-bold mt-1', tc.body)}>{event.epicenter}</p>
            )}
          </div>
        )}

        {/* コメント（手動発報・訓練の備考） */}
        {event.comment && (
          <p className={cn('text-sm leading-relaxed', tc.body)}>
            {event.comment}
          </p>
        )}

        {/* 震度もコメントもない場合 */}
        {event.max_intensity == null && !event.comment && (
          <p className={cn('text-base font-bold', tc.title)}>安否確認を行ってください</p>
        )}

        {/* 発報者 */}
        <p className={cn('text-xs pt-1 border-t', isDrill ? 'text-amber-900/50 border-amber-500/40' : 'text-white/50 border-white/20')}>
          発報者：{event.issuer ?? '自動'}
        </p>
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
