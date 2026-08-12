import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { EventSummary } from '@/components/event-summary'
import { StatusSection } from '@/components/status-section'
import { getStatusGroup } from '@/lib/utils'
import type { EmployeeWithStatus, Event, Response } from '@/types'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: event } = await admin
    .from('events')
    .select('*')
    .eq('event_id', id)
    .single()

  if (!event) notFound()

  const [{ data: allEmployees }, { data: allResponses }] = await Promise.all([
    admin
      .from('employees')
      .select('employee_number, name, email, department')
      .eq('is_active', true)
      .order('employee_number'),
    admin
      .from('responses')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: false }),
  ])

  const employees = allEmployees ?? []
  const responses = (allResponses ?? []) as Response[]

  const latestByEmployee = new Map<string, Response>()
  for (const r of responses) {
    if (!latestByEmployee.has(r.employee_number)) {
      latestByEmployee.set(r.employee_number, r)
    }
  }

  const totalCount = employees.length
  const answeredCount = [...latestByEmployee.values()].filter((r) => r.self_status !== null).length

  const employeesWithStatus: EmployeeWithStatus[] = employees.map((emp) => {
    const latestResponse = latestByEmployee.get(emp.employee_number) ?? null
    return { ...emp, latestResponse, statusGroup: getStatusGroup(latestResponse) }
  })

  const bgClass = (event as Event).event_type === 'test' ? 'bg-amber-50' : 'bg-red-50'

  return (
    <div className="space-y-6">
      <div className={`fixed inset-0 -z-10 ${bgClass}`} />
      <Link href="/history" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        ← 履歴に戻る
      </Link>

      <EventSummary
        event={event as Event}
        answeredCount={answeredCount}
        totalCount={totalCount}
      />

      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          回答状況一覧
        </h2>
        <StatusSection employees={employeesWithStatus} />
      </section>
    </div>
  )
}
