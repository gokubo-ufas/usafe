import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentEmployee } from '@/lib/auth/session'
import { InlineResponseForm } from './inline-response-form'
import { EventSummary } from '@/components/event-summary'
import { formatDateTime, formatIntensity, getDisplayEventType, getStatusGroup, STATUS_GROUP_CONFIG } from '@/lib/utils'
import { cn } from '@/lib/cn'
import type { Event, Response } from '@/types'

type GroupCounts = { safe: number; critical: number; checking: number; unanswered: number; total: number }

export default async function DashboardPage() {
  const employee = await getCurrentEmployee()
  if (!employee) redirect('/login')

  const admin = createAdminClient()

  const { data: latestEvent } = await admin
    .from('events')
    .select('*')
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestEvent) {
    return (
      <div className="px-4 pt-8 text-center space-y-3">
        <div className="text-4xl">✅</div>
        <h2 className="text-base font-semibold text-gray-800">現在イベントはありません</h2>
        <p className="text-sm text-gray-400">安否確認が発報されると、ここに表示されます。</p>
      </div>
    )
  }

  const [
    { data: myLatestResponse },
    { count: totalEmployees },
    { data: answeredData },
  ] = await Promise.all([
    admin.from('responses').select('self_status')
      .eq('event_id', latestEvent.event_id)
      .eq('employee_number', employee.employee_number)
      .maybeSingle(),
    admin.from('employees').select('*', { count: 'exact', head: true }),
    admin.from('responses').select('employee_number')
      .eq('event_id', latestEvent.event_id)
      .not('self_status', 'is', null),
  ])

  const hasAnswered = !!myLatestResponse?.self_status
  const formAnsweredCount = new Set((answeredData ?? []).map((r) => r.employee_number)).size
  const formTotalCount = totalEmployees ?? 0

  if (!hasAnswered) {
    const bgClass = latestEvent.event_type === 'test' ? 'bg-amber-50' : 'bg-red-50'
    return (
      <>
        <div className={`fixed inset-0 -z-10 ${bgClass}`} />
        <InlineResponseForm event={latestEvent as Event} answeredCount={formAnsweredCount} totalCount={formTotalCount} />
      </>
    )
  }

  const [{ data: allEvents }, { data: allResponses }] = await Promise.all([
    admin
      .from('events')
      .select('event_id, event_type, issued_at, issuer, comment, earthquake_info_id, max_intensity, epicenter')
      .order('issued_at', { ascending: false })
      .limit(50),
    admin
      .from('responses')
      .select('event_id, employee_number, self_status, family_status, work_status, created_at')
      .order('created_at', { ascending: false }),
  ])

  const events = (allEvents ?? []) as Pick<Event, 'event_id' | 'event_type' | 'issued_at' | 'issuer' | 'comment' | 'earthquake_info_id' | 'max_intensity' | 'epicenter'>[]

  const latestByKey = new Map<string, Response>()
  for (const r of (allResponses ?? []) as Response[]) {
    const key = `${r.event_id}:${r.employee_number}`
    if (!latestByKey.has(key)) latestByKey.set(key, r)
  }

  const countMap = new Map<string, GroupCounts>()
  for (const e of events) {
    countMap.set(e.event_id, { safe: 0, critical: 0, checking: 0, unanswered: 0, total: 0 })
  }
  for (const r of latestByKey.values()) {
    const c = countMap.get(r.event_id)
    if (!c) continue
    c.total++
    if (r.self_status !== null) c[getStatusGroup(r)]++
    else c.unanswered++
  }

  const [latest, ...past] = events

  return (
    <div className="space-y-6">
      {latest && (
        <section>
          <h2 className="text-base font-bold text-gray-600 px-4 pt-4 pb-2">最新の発報</h2>
          <Link href={`/events/${latest.event_id}`} className="block group">
            <EventSummary
              event={latest as Event}
              answeredCount={(countMap.get(latest.event_id)?.safe ?? 0) + (countMap.get(latest.event_id)?.critical ?? 0) + (countMap.get(latest.event_id)?.checking ?? 0)}
              totalCount={countMap.get(latest.event_id)?.total ?? 0}
              showProgress={false}
            />
            <div className="flex items-center justify-center gap-1.5 py-2.5 bg-white border-b border-gray-100 text-xs font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
              回答状況・詳細を確認する
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </Link>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-600 px-4 mb-2">
            過去の発報
            <span className="text-xs font-normal text-gray-400 ml-2">（回答受付終了）</span>
          </h2>
          <div className="divide-y divide-gray-100 border-y border-gray-100">
            {past.map((event) => (
              <EventCard key={event.event_id} event={event} counts={countMap.get(event.event_id)} />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}

type CardEvent = Pick<Event, 'event_id' | 'event_type' | 'issued_at' | 'issuer' | 'comment' | 'earthquake_info_id' | 'max_intensity' | 'epicenter'>

const STATUS_ITEMS = [
  { key: 'critical'  as const, label: '要対応' },
  { key: 'checking'  as const, label: '確認中' },
  { key: 'unanswered'as const, label: '未回答' },
  { key: 'safe'      as const, label: '無事'   },
]

function EventCard({ event, counts }: { event: CardEvent; counts?: GroupCounts }) {
  const displayType = getDisplayEventType(event)
  const isDrill = displayType === 'test'
  const answered = (counts?.safe ?? 0) + (counts?.critical ?? 0) + (counts?.checking ?? 0)
  const total = counts?.total ?? 0

  return (
    <Link
      href={`/events/${event.event_id}`}
      className="block bg-white hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-stretch gap-3 px-4 py-3.5">
        {/* 左アクセントライン */}
        <div className={cn('w-1 shrink-0', isDrill ? 'bg-amber-300' : 'bg-red-400')} />

        <div className="flex-1 min-w-0">
          {/* 上段：発報タイプ＋日時（左）　回答数（右） */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 shrink-0', isDrill ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                {isDrill ? '訓練' : '本番'}
              </span>
              <span className="text-[11px] text-gray-400 tabular-nums">{formatDateTime(event.issued_at)}</span>
              <span className="text-[11px] text-gray-400 truncate">発報：{event.issuer ?? '自動発報'}</span>
            </div>
            <span className="text-sm font-bold text-gray-700 tabular-nums shrink-0">{answered}<span className="text-xs font-normal text-gray-400"> / {total}名</span></span>
          </div>

          {/* 震度＋震源地（大きめ） */}
          {event.max_intensity != null ? (
            <p className="text-base font-bold text-gray-800 mb-1 leading-snug">
              震度{formatIntensity(event.max_intensity)}
              {event.epicenter && <span className="text-sm font-normal text-gray-500 ml-2">{event.epicenter}</span>}
            </p>
          ) : (
            <p className="text-sm font-semibold text-gray-600 mb-1">安否確認</p>
          )}

          {/* 特記事項 */}
          <p className="text-xs text-gray-400 truncate mb-2">
            <span className="mr-1">特記事項</span>
            <span className="text-gray-500">{event.comment ?? '—'}</span>
          </p>

          {/* ステータス（静かなテキスト表示） */}
          <div className="flex items-center justify-end gap-3">
            {STATUS_ITEMS.map(({ key, label }) => (
              <span key={key} className="text-[10px] tabular-nums">
                <span className={STATUS_GROUP_CONFIG[key].textColor + ' font-bold'}>{counts?.[key] ?? 0}</span>
                <span className="text-gray-400 ml-0.5">{label}</span>
              </span>
            ))}
          </div>
        </div>

        <svg className="w-4 h-4 text-gray-300 shrink-0 self-center" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  )
}
