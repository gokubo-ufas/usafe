import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDateTime, isWithin24Hours } from '@/lib/utils'
import type { Event } from '@/types'

const TYPE_CONFIG: Record<Event['event_type'], { label: string; className: string }> = {
  earthquake: { label: '地震', className: 'bg-red-100 text-red-700' },
  test:       { label: '訓練', className: 'bg-blue-100 text-blue-700' },
  manual:     { label: '手動', className: 'bg-orange-100 text-orange-700' },
}

export default async function HistoryPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('events')
    .select('event_id, event_type, issued_at, issuer, comment')
    .order('issued_at', { ascending: false })
    .limit(50)

  const events = (data ?? []) as Pick<Event, 'event_id' | 'event_type' | 'issued_at' | 'issuer' | 'comment'>[]

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">履歴はありません</h2>
        <p className="text-sm text-gray-400">安否確認が発報されると、ここに記録されます。</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-gray-900">発報履歴</h1>

      {events.map((event) => {
        const isActive = isWithin24Hours(event.issued_at)
        const type = TYPE_CONFIG[event.event_type] ?? { label: event.event_type, className: 'bg-gray-100 text-gray-600' }

        return (
          <Link
            key={event.event_id}
            href={`/history/${event.event_id}`}
            className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${type.className}`}>
                  {type.label}
                </span>
                {isActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    受付中
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700">{formatDateTime(event.issued_at)}</p>
              {event.comment && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{event.comment}</p>
              )}
            </div>
            <span className="text-gray-300 text-lg shrink-0">›</span>
          </Link>
        )
      })}
    </div>
  )
}
