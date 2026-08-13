import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentEmployee } from '@/lib/auth/session'
import { InlineResponseForm } from './inline-response-form'
import { signOut } from '@/app/auth/actions'
import { formatDateTime, formatDateTimeFull, formatIntensity, getDisplayEventType, getStatusGroup, SELF_STATUS_LABELS, FAMILY_STATUS_LABELS, WORK_STATUS_LABELS } from '@/lib/utils'
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
  const myResponseForLatest = latest
    ? (latestByKey.get(`${latest.event_id}:${employee.employee_number}`) ?? null)
    : null

  return (
    <div className="space-y-6">
      {latest && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 px-4 pt-4 pb-2">最新の発報</h2>
          <LatestEventPanel event={latest} myResponse={myResponseForLatest} counts={countMap.get(latest.event_id)} />
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 px-4 mb-2">過去の発報</h2>
          <div className="divide-y divide-gray-100 border-y border-gray-100">
            {past.map((event) => (
              <EventCard key={event.event_id} event={event} counts={countMap.get(event.event_id)} />
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-3 px-4">
        <Link
          href="/dispatch"
          className="flex-1 py-2.5 text-sm font-semibold text-center text-red-600 border border-red-200 rounded-none hover:bg-red-50 transition-colors"
        >
          発報管理
        </Link>
        <form action={signOut} className="flex-1">
          <button
            type="submit"
            className="w-full py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-none hover:bg-gray-50 transition-colors"
          >
            ログアウト
          </button>
        </form>
      </div>
    </div>
  )
}

type CardEvent = Pick<Event, 'event_id' | 'event_type' | 'issued_at' | 'issuer' | 'comment' | 'earthquake_info_id' | 'max_intensity' | 'epicenter'>

function LatestEventPanel({
  event,
  myResponse,
  counts,
}: {
  event: CardEvent
  myResponse: Response | null
  counts?: GroupCounts
}) {
  const isDrill = getDisplayEventType(event) === 'test'
  const answered = (counts?.safe ?? 0) + (counts?.critical ?? 0) + (counts?.checking ?? 0)

  return (
    <div className="border-y border-gray-100 overflow-hidden">
      {/* カラーブロック：全情報（全テキスト白太字） */}
      <div className={cn('px-4 pt-4 pb-4 font-bold text-white', isDrill ? 'bg-amber-400' : 'bg-red-600')}>
        {/* 震度（左）＋ 回答数・発報情報（右） */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {event.max_intensity != null ? (
              <>
                <p className="text-xs tracking-[0.15em] uppercase mb-0.5">最大震度</p>
                <p className="font-black leading-none tracking-tighter"
                   style={{ fontSize: 'clamp(3rem, 15vw, 4.5rem)' }}>
                  {formatIntensity(event.max_intensity)}
                </p>
                {event.epicenter && (
                  <p className="text-xl mt-1.5">
                    <span className="text-xs mr-1">震源地：</span>
                    {event.epicenter}
                  </p>
                )}
              </>
            ) : !event.comment ? (
              <p className="text-lg">安否確認を行ってください</p>
            ) : null}
          </div>
          <div className="text-right shrink-0">
            {counts && (
              <div className="mb-3">
                <span className="font-black text-2xl leading-none">{answered}</span>
                <span className="text-sm"> / {counts.total}名</span>
                <p className="text-[10px] mt-0.5">回答済み</p>
              </div>
            )}
            <p className="text-[11px] tabular-nums leading-relaxed">
              {formatDateTimeFull(event.issued_at)}<br />
              発報（{event.issuer ?? '自動発報'}）
            </p>
          </div>
        </div>

        {/* 特記事項（常時表示） */}
        <p className="text-sm mb-4 leading-relaxed">
          <span className="text-xs tracking-[0.1em] uppercase mr-2">特記事項</span>
          {event.comment ?? '—'}
        </p>

        {/* 警告文（右下） */}
        <div className="flex justify-end mt-1">
          <p className="text-sm tracking-wide">
            ※ {isDrill ? 'これは避難訓練です' : 'これは訓練ではありません'}
          </p>
        </div>
      </div>

      {/* あなたの回答 */}
      <div className="bg-white px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-700">あなたの回答</h3>
          {myResponse?.self_status ? (
            <span className="text-xs font-bold text-white bg-emerald-500 px-2.5 py-1">✓ 回答済み</span>
          ) : (
            <span className="text-xs font-bold text-white bg-red-500 px-2.5 py-1 animate-pulse">未回答</span>
          )}
        </div>
        {myResponse?.self_status && (
          <div className="grid grid-cols-3 gap-x-2 text-[11px]">
            <span><span className="text-gray-400">本人：</span><span className="font-semibold text-gray-700">{SELF_STATUS_LABELS[myResponse.self_status] ?? myResponse.self_status}</span></span>
            <span><span className="text-gray-400">家族：</span><span className="font-semibold text-gray-700">{myResponse.family_status ? (FAMILY_STATUS_LABELS[myResponse.family_status] ?? myResponse.family_status) : '—'}</span></span>
            <span><span className="text-gray-400">業務：</span><span className="font-semibold text-gray-700">{myResponse.work_status ? (WORK_STATUS_LABELS[myResponse.work_status] ?? myResponse.work_status) : '—'}</span></span>
          </div>
        )}
        <Link
          href={`/events/${event.event_id}`}
          className={cn(
            'block w-full py-2.5 text-center text-sm font-semibold transition-colors',
            isDrill
              ? 'bg-amber-400 text-amber-950 hover:bg-amber-500'
              : 'bg-red-500 text-white hover:bg-red-600',
          )}
        >
          {myResponse?.self_status ? '回答を更新する' : '今すぐ回答する'}
        </Link>
      </div>
    </div>
  )
}

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
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* 左アクセントライン */}
        <div className={cn('w-1 h-12 shrink-0', isDrill ? 'bg-amber-400' : 'bg-red-500')} />

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'text-xs font-bold px-2 py-0.5',
              isDrill ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800',
            )}>
              {isDrill ? '🟡 訓練' : '🔴 本番'}
            </span>
            <span className="text-xs text-gray-400 tabular-nums">{formatDateTime(event.issued_at)}</span>
          </div>
          {event.max_intensity != null && (
            <p className="text-sm font-bold text-gray-800">
              震度{formatIntensity(event.max_intensity)}
              {event.epicenter && <span className="font-normal text-gray-500 ml-2">{event.epicenter}</span>}
            </p>
          )}
          {!event.max_intensity && event.comment && (
            <p className="text-sm text-gray-600 truncate">{event.comment}</p>
          )}
        </div>

        <div className="text-right shrink-0 space-y-1">
          <p className="text-base font-bold text-gray-900 tabular-nums">
            {answered}<span className="text-xs font-normal text-gray-400"> / {total}名</span>
          </p>
          <div className="flex items-center gap-1 justify-end flex-wrap">
            {(counts?.critical ?? 0) > 0 && (
              <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5">
                要対応 {counts!.critical}
              </span>
            )}
            {(counts?.unanswered ?? 0) > 0 && (
              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5">
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
