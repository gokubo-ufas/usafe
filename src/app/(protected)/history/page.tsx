import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDateTime, getDisplayEventType, DISPLAY_EVENT_TYPE_CONFIG, getStatusGroup } from '@/lib/utils'
import type { Event, Response } from '@/types'

type HistoryEvent = Pick<Event, 'event_id' | 'event_type' | 'issued_at' | 'issuer' | 'comment' | 'earthquake_info_id'>

type GroupCounts = { safe: number; critical: number; checking: number; unanswered: number; total: number }

export default async function HistoryPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('events')
    .select('event_id, event_type, issued_at, issuer, comment, earthquake_info_id')
    .order('issued_at', { ascending: false })
    .limit(50)

  const events = (data ?? []) as HistoryEvent[]

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h2 className="text-base font-semibold text-gray-800 mb-1">履歴はありません</h2>
        <p className="text-sm text-gray-400">安否確認が発報されると、ここに記録されます。</p>
      </div>
    )
  }

  const eventIds = events.map((e) => e.event_id)

  const [, { count: totalEmployees }] = await Promise.all([
    admin
      .from('responses')
      .select('event_id, self_status, family_status, work_status, comment')
      .in('event_id', eventIds),
    admin
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
  ])

  const total = totalEmployees ?? 0

  // event_id ごとに最新レスポンスを集約してグループ集計
  const summaryMap = new Map<string, GroupCounts>()
  for (const eventId of eventIds) {
    summaryMap.set(eventId, { safe: 0, critical: 0, checking: 0, unanswered: 0, total })
  }

  // 同一 event_id + employee_number の最新1件を使いたいが、
  // responses テーブルには employee_number が必要。employee_number を追加取得
  const { data: detailData } = await admin
    .from('responses')
    .select('event_id, employee_number, self_status, family_status, work_status, comment, created_at')
    .in('event_id', eventIds)
    .order('created_at', { ascending: false })

  const latestByKey = new Map<string, Response>()
  for (const r of (detailData ?? []) as Response[]) {
    const key = `${r.event_id}:${r.employee_number}`
    if (!latestByKey.has(key)) latestByKey.set(key, r)
  }

  for (const r of latestByKey.values()) {
    const counts = summaryMap.get(r.event_id)
    if (!counts) continue
    if (r.self_status !== null) {
      const group = getStatusGroup(r)
      counts[group]++
    }
  }

  // 未回答 = total - 回答済み
  for (const counts of summaryMap.values()) {
    const answered = counts.safe + counts.critical + counts.checking
    counts.unanswered = Math.max(0, total - answered)
  }

  const [latest, ...rest] = events

  return (
    <div className="space-y-6">

      {/* 最新 */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold tracking-widest text-emerald-600 uppercase">最新</h2>
        <EventCard event={latest} counts={summaryMap.get(latest.event_id) ?? { safe: 0, critical: 0, checking: 0, unanswered: 0, total: 0 }} href="/dashboard" />
      </section>

      {/* 発報履歴 */}
      {rest.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase">発報履歴</h2>
          {rest.map((event) => (
            <EventCard
              key={event.event_id}
              event={event}
              counts={summaryMap.get(event.event_id) ?? { safe: 0, critical: 0, checking: 0, unanswered: 0, total: 0 }}
            />
          ))}
        </section>
      )}

    </div>
  )
}

function EventCard({ event, counts, href }: { event: HistoryEvent; counts: GroupCounts; href?: string }) {
  const displayType = getDisplayEventType(event)
  const { label, className } = DISPLAY_EVENT_TYPE_CONFIG[displayType]
  const answered = counts.safe + counts.critical + counts.checking
  const pct = counts.total > 0 ? Math.round((answered / counts.total) * 100) : 0
  const eventTitle = event.event_type === 'test' ? '安否確認訓練' : '安否確認'

  return (
    <Link
      href={href ?? `/history/${event.event_id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow space-y-2"
    >
      {/* 日時（左上固定） */}
      <p className="text-xs text-gray-400 tabular-nums">{formatDateTime(event.issued_at)}</p>

      {/* バッジ + タイトル */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${className}`}>
          {label}
        </span>
        <p className="text-sm font-bold text-gray-900">{eventTitle}</p>
      </div>

      {/* コメント */}
      {event.comment && (
        <p className="text-xs text-gray-500 truncate">{event.comment}</p>
      )}

      {/* 発報者 */}
      <p className="text-xs text-gray-400">
        発報者：<span className="font-medium text-gray-600">{event.issuer ?? '自動'}</span>
      </p>

      {/* 右下: 回答率 + サマリバッジ */}
      <div className="flex justify-end pt-1">
        <div className="text-right space-y-1.5">
          <p className="text-xs text-gray-400 tabular-nums">{answered}/{counts.total}名 ({pct}%)</p>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {counts.critical > 0 && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                負傷 {counts.critical}
              </span>
            )}
            {counts.checking > 0 && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                確認中 {counts.checking}
              </span>
            )}
            {counts.unanswered > 0 && (
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                未回答 {counts.unanswered}
              </span>
            )}
            {counts.safe > 0 && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                無事 {counts.safe}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
