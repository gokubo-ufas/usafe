import type { Event } from '@/types'
import { EventColorBlock } from './event-color-block'

type Props = {
  event: Event
  answeredCount: number
  totalCount: number
  showProgress?: boolean
}

export function EventSummary({ event, answeredCount, totalCount, showProgress = true }: Props) {
  const pct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0

  return (
    <div className="bg-white border-y border-gray-100 overflow-hidden">
      <EventColorBlock event={event} answeredCount={answeredCount} totalCount={totalCount} />
      {showProgress && (
        <div className="px-4 py-3 space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-gray-500 font-medium">回答率</span>
            <span className="text-xs text-gray-700 font-bold tabular-nums">{pct}%　{answeredCount} / {totalCount}名</span>
          </div>
          <div className="h-2 bg-gray-100 overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: pct === 100
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : 'linear-gradient(90deg, #34d399, #10b981)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
