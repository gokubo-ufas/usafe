import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentEmployee } from '@/lib/auth/session'
import { EventSummary } from '@/components/event-summary'
import { StatusSection } from '@/components/status-section'
import { ResponseForm } from '@/components/response-form'
import { getStatusGroup, SELF_STATUS_LABELS, FAMILY_STATUS_LABELS, WORK_STATUS_LABELS } from '@/lib/utils'
import type { EmployeeWithStatus, Event, Response } from '@/types'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const employee = await getCurrentEmployee()
  if (!employee) redirect('/login')

  const admin = createAdminClient()

  const [{ data: event }, { data: latestEvent }] = await Promise.all([
    admin.from('events').select('*').eq('event_id', id).single(),
    admin.from('events').select('event_id').order('issued_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (!event) notFound()

  const isLatest = latestEvent?.event_id === id

  const [{ data: allResponses }, { data: allEmployees }] = await Promise.all([
    admin.from('responses').select('*').eq('event_id', id).order('created_at', { ascending: false }),
    admin.from('employees').select('employee_number, name, email, department'),
  ])

  const responses = (allResponses ?? []) as Response[]
  const employeeMap = new Map((allEmployees ?? []).map((e) => [e.employee_number, e]))

  const latestByEmployee = new Map<string, Response>()
  for (const r of responses) {
    if (!latestByEmployee.has(r.employee_number)) latestByEmployee.set(r.employee_number, r)
  }

  const totalCount = latestByEmployee.size
  const answeredCount = [...latestByEmployee.values()].filter((r) => r.self_status !== null).length
  const myResponse = latestByEmployee.get(employee.employee_number) ?? null

  const employeesWithStatus: EmployeeWithStatus[] = [...latestByEmployee.entries()]
    .map(([empNum, latestResponse]) => {
      const emp = employeeMap.get(empNum)
      return {
        employee_number: empNum,
        name:       latestResponse.name       ?? emp?.name       ?? '',
        email:      emp?.email ?? '',
        department: latestResponse.department ?? emp?.department ?? null,
        latestResponse,
        statusGroup: getStatusGroup(latestResponse),
      }
    })
    .sort((a, b) =>
      new Date(b.latestResponse!.created_at).getTime() -
      new Date(a.latestResponse!.created_at).getTime()
    )

  const bgClass = (event as Event).event_type === 'test' ? 'bg-amber-50' : 'bg-red-50'

  return (
    <div className="space-y-4">
      <div className={`fixed inset-0 -z-10 ${bgClass}`} />

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
        </svg>
        ホームへ
      </Link>

      <EventSummary event={event as Event} answeredCount={answeredCount} totalCount={totalCount} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-emerald-700 shrink-0">あなたの回答</h2>
          {myResponse?.self_status ? (
            <span className="text-xs font-bold text-white bg-emerald-500 px-2.5 py-1 rounded-full whitespace-nowrap">
              ✓ 回答済み
            </span>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-red-600 animate-pulse whitespace-nowrap">急いでください！</span>
              <span className="text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-full animate-pulse whitespace-nowrap">未回答</span>
            </div>
          )}
        </div>

        {myResponse?.self_status && (
          <div className="grid grid-cols-3 gap-x-2 text-[11px]">
            <span><span className="text-gray-400">本人：</span><span className="font-semibold text-gray-700">{SELF_STATUS_LABELS[myResponse.self_status] ?? myResponse.self_status}</span></span>
            <span><span className="text-gray-400">家族：</span><span className="font-semibold text-gray-700">{myResponse.family_status ? (FAMILY_STATUS_LABELS[myResponse.family_status] ?? myResponse.family_status) : '—'}</span></span>
            <span><span className="text-gray-400">業務：</span><span className="font-semibold text-gray-700">{myResponse.work_status ? (WORK_STATUS_LABELS[myResponse.work_status] ?? myResponse.work_status) : '—'}</span></span>
          </div>
        )}

        {isLatest && (
          <ResponseForm
            eventId={id}
            hasAnswered={!!myResponse?.self_status}
            currentResponse={myResponse}
          />
        )}
      </div>

      <StatusSection employees={employeesWithStatus} />
    </div>
  )
}
