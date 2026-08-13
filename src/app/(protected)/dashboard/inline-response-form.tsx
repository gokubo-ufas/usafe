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
      <legend className="text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
        {legend}<span className="text-red-400 ml-1">*</span>
      </legend>
      <div className="flex rounded-xl overflow-hidden border border-white/10 divide-x divide-white/10">
        {options.map(({ value, label }) => (
          <label
            key={value}
            className={cn(
              'flex-1 flex items-center justify-center text-center py-2.5 px-1 text-[11px] font-medium cursor-pointer leading-snug transition-colors',
              'text-white/40 bg-white/[0.04] hover:bg-white/[0.08]',
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
    <div className="space-y-4">
      {/* イベントコンテキスト */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'text-xs font-bold px-2.5 py-0.5 rounded-full border',
            isDrill
              ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
              : 'bg-red-500/20 text-red-300 border-red-500/30',
          )}>
            {isDrill ? '🟡 避難訓練' : '🔴 安否確認'}
          </span>
          <span className="text-xs text-white/35 tabular-nums">{formatDateTime(event.issued_at)}</span>
        </div>
        {event.max_intensity != null && (
          <p className={cn('text-2xl font-black tracking-tight', isDrill ? 'text-amber-300' : 'text-red-300')}>
            最大震度{formatIntensity(event.max_intensity)}
            {event.epicenter && <span className="text-lg font-bold ml-2 text-white/70">{event.epicenter}</span>}
          </p>
        )}
        {event.comment && (
          <p className="text-sm text-white/60 leading-relaxed">{event.comment}</p>
        )}
        <p className="text-xs text-white/30">発報者：{event.issuer ?? '自動'}</p>
      </div>

      {/* 回答フォーム */}
      <form action={formAction} className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-4 space-y-4">
        <input type="hidden" name="event_id" value={event.event_id} />

        <RadioGroup name="self_status"   legend="本人の状況" options={SELF_OPTIONS}   isDrill={isDrill} />
        <RadioGroup name="family_status" legend="家族の状況" options={FAMILY_OPTIONS} isDrill={isDrill} />
        <RadioGroup name="work_status"   legend="業務対応"   options={WORK_OPTIONS}   isDrill={isDrill} />

        <div>
          <label htmlFor="inline-comment" className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
            コメント <span className="font-normal text-white/30 normal-case tracking-normal">（任意・50文字以内）</span>
          </label>
          <textarea
            id="inline-comment"
            name="comment"
            rows={2}
            maxLength={50}
            placeholder="状況を補足するコメントがあれば"
            className="w-full text-sm text-white/80 placeholder:text-white/20 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30 resize-none"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'w-full py-3 text-sm font-bold rounded-xl transition-colors disabled:opacity-50',
            isDrill
              ? 'bg-amber-400 hover:bg-amber-300 text-amber-950'
              : 'bg-red-500 hover:bg-red-400 text-white',
          )}
        >
          {isPending ? '送信中…' : '安否を報告する'}
        </button>
      </form>
    </div>
  )
}
