import type { Event } from '@/types'
import { formatDateTime } from '@/lib/utils'

type Props = {
  event: Event
  answeredCount: number
  totalCount: number
}

export function EventSummary({ event, answeredCount, totalCount }: Props) {
  const { event_type } = event
  const isEarthquake = event_type === 'earthquake'
  const hasIntensity = isEarthquake && event.max_intensity !== null
  const hasEpicenter = isEarthquake && event.epicenter !== null

  const typeBadge = {
    earthquake: { label: '地震', className: 'bg-red-100 text-red-700' },
    test:       { label: '訓練', className: 'bg-blue-100 text-blue-700' },
    manual:     { label: '手動', className: 'bg-orange-100 text-orange-700' },
  }[event_type] ?? { label: event_type, className: 'bg-gray-100 text-gray-700' }

  const eventTitle = event_type === 'test' ? '安否確認訓練' : '安否確認'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge.className}`}>
              {typeBadge.label}
            </span>
            <span className="text-sm text-gray-500">{formatDateTime(event.issued_at)}</span>
          </div>

          <h2 className="text-base font-bold text-gray-900 mb-2">{eventTitle}</h2>

          <dl className="space-y-1 text-sm text-gray-600">
            {hasIntensity && (
              <div className="flex gap-2">
                <dt className="text-gray-400 shrink-0">最大震度</dt>
                <dd className="font-medium text-gray-900">震度 {event.max_intensity}</dd>
              </div>
            )}
            {hasEpicenter && (
              <div className="flex gap-2">
                <dt className="text-gray-400 shrink-0">震源地</dt>
                <dd className="font-medium text-gray-900">{event.epicenter}</dd>
              </div>
            )}
            {event.comment && (
              <div className="flex gap-2">
                <dt className="text-gray-400 shrink-0">備考</dt>
                <dd className="text-gray-700">{event.comment}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-gray-900">{answeredCount}</div>
          <div className="text-xs text-gray-400">/ {totalCount} 名</div>
          <div className="text-xs text-gray-400 mt-0.5">回答済み</div>
        </div>
      </div>
    </div>
  )
}
