import type { Event } from '@/types'
import { formatDateTime, getDisplayEventType, DISPLAY_EVENT_TYPE_CONFIG } from '@/lib/utils'

type Props = {
  event: Event
  answeredCount: number
  totalCount: number
}

export function EventSummary({ event, answeredCount, totalCount }: Props) {
  const displayType = getDisplayEventType(event)
  const { label, className } = DISPLAY_EVENT_TYPE_CONFIG[displayType]
  const isEarthquake = event.event_type === 'earthquake'
  const eventTitle = event.event_type === 'test' ? '安否確認訓練' : '安否確認'
  const pct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* カラーアクセントバー */}
      <div className={`h-3 w-full ${displayType === 'test' ? 'bg-amber-400' : 'bg-red-400'}`} />

      <div className="p-5 space-y-4">
        {/* ヘッダー */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${className}`}>
                {label}
              </span>
              <span className="text-sm text-gray-400 tabular-nums">{formatDateTime(event.issued_at)}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{eventTitle}</h2>
          </div>

          {/* 回答人数 */}
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold tabular-nums text-gray-900 tracking-tight">
              {answeredCount}
              <span className="text-base font-normal text-gray-400 ml-1">/ {totalCount}名</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">回答済み</div>
          </div>
        </div>

        {/* 地震情報 */}
        {isEarthquake && (event.max_intensity !== null || event.epicenter !== null) && (
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {event.max_intensity !== null && (
              <div className="flex items-baseline gap-1.5 text-sm">
                <span className="text-xs text-gray-400">最大震度</span>
                <span className="font-bold text-gray-900">震度 {event.max_intensity}</span>
              </div>
            )}
            {event.epicenter !== null && (
              <div className="flex items-baseline gap-1.5 text-sm">
                <span className="text-xs text-gray-400">震源地</span>
                <span className="font-semibold text-gray-900">{event.epicenter}</span>
              </div>
            )}
          </div>
        )}

        {event.comment && (
          <p className="text-sm text-gray-500">{event.comment}</p>
        )}

        {/* 進捗バー */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] text-gray-400 font-medium">回答率</span>
            <span className="text-[11px] text-gray-500 font-semibold tabular-nums">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: pct === 100
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : 'linear-gradient(90deg, #34d399, #10b981)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
