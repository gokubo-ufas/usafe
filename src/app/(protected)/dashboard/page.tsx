import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentEmployee } from '@/lib/auth/session'
import { InlineResponseForm } from './inline-response-form'
import { formatDateTime, formatIntensity, getDisplayEventType, getStatusGroup } from '@/lib/utils'
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-base font-semibold text-gray-800 mb-1">現在イベントはありません</h2>
        <p className="text-sm text-gray-400">安否確認が発報されると、ここに表示されます。</p>
      </div>
    )
  }

  // 自分の最新イベントへの回答を確認
  const { data: myLatestResponse } = await admin
    .from('responses')
    .select('self_status')
    .eq('event_id', latestEvent.event_id)
    .eq('employee_number', employee.employee_number)
    .maybeSingle()

  const hasAnswered = !!myLatestResponse?.self_status

  // 未回答 → インラインフォームを表示
  if (!hasAnswered) {
    const bgClass = latestEvent.event_type === 'test' ? 'bg-amber-50' : 'bg-red-50'
    return (
      <>
        <div className={`fixed inset-0 -z-10 ${bgClass}`} />
        <InlineResponseForm event={latestEvent as Event} />
      </>
    )
  }

  // 回答済み → 発報一覧を表示
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

  // イベントごとの最新回答で集計
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

  const latestId = latestEvent.event_id
  const [latest, ...past] = events

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <SectionLabel>最新の発報</SectionLabel>
        {latest && (
          <EventCard event={latest} counts={countMap.get(latest.event_id)} />
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-2">
          <SectionLabel muted>過去の発報</SectionLabel>
          {past.map((event) => (
            <EventCard key={event.event_id} event={event} counts={countMap.get(event.event_id)} />
          ))}
        </section>
      )}
    </div>
  )
}

function SectionLabel({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <h2 className={cn(
      'text-xs font-bold uppercase tracking-widest px-1',
      muted ? 'text-gray-400' : 'text-emerald-600',
    )}>
      {children}
    </h2>
  )
}

type CardEvent = Pick<Event, 'event_id' | 'event_type' | 'issued_at' | 'issuer' | 'comment' | 'earthquake_info_id' | 'max_intensity' | 'epicenter'>

function EventCard({ event, counts }: { event: CardEvent; counts?: GroupCounts }) {
  const displayType = getDisplayEventType(event)
  const isDrill = displayType === 'test'
  const answered = (counts?.safe ?? 0) + (counts?.critical ?? 0) + (counts?.checking ?? 0)
  const total = counts?.total ?? 0

  return (
    <Link
      href={`/events/${event.event_id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className={cn('h-1 w-full', isDrill ? 'bg-amber-400' : 'bg-red-500')} />
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full',
              isDrill ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800',
            )}>
              {isDrill ? '🟡 訓練' : '🔴 本番'}
            </span>
            <span className="text-xs text-gray-400 tabular-nums">{formatDateTime(event.issued_at)}</span>
          </div>
          {event.max_intensity != null && (
            <p className="text-xs text-gray-600">
              震度{formatIntensity(event.max_intensity)}{event.epicenter ? `　${event.epicenter}` : ''}
            </p>
          )}
          {!event.max_intensity && event.comment && (
            <p className="text-xs text-gray-500 truncate">{event.comment}</p>
          )}
        </div>

        <div className="text-right shrink-0 space-y-1">
          <p className="text-sm font-bold text-gray-900 tabular-nums">
            {answered}<span className="text-xs font-normal text-gray-400"> / {total}名</span>
          </p>
          <div className="flex items-center gap-1 justify-end flex-wrap">
            {(counts?.critical ?? 0) > 0 && (
              <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                要対応 {counts!.critical}
              </span>
            )}
            {(counts?.unanswered ?? 0) > 0 && (
              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                未回答 {counts!.unanswered}
              </span>
            )}
          </div>
        </div>

        <svg className="w-4 h-4 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  )
}
