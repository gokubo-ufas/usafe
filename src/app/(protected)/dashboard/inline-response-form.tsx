'use client'

import { useActionState } from 'react'
import { submitResponse } from './actions'
import { cn } from '@/lib/cn'
import { EventColorBlock } from '@/components/event-color-block'
import { RadioGroup, SELF_OPTIONS, FAMILY_ROWS, WORK_OPTIONS } from '@/components/radio-group'
import type { Event } from '@/types'

type State = { error?: string }
const INIT: State = {}

export function InlineResponseForm({ event, answeredCount, totalCount }: { event: Event; answeredCount: number; totalCount: number }) {
  const [state, formAction, isPending] = useActionState(submitResponse, INIT)
  const isDrill = event.event_type === 'test'

  return (
    <div>
      <EventColorBlock event={event} answeredCount={answeredCount} totalCount={totalCount} />
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
