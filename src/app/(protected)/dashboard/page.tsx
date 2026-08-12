import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentEmployee } from '@/lib/auth/session'
import { EventSummary } from '@/components/event-summary'
import { StatusSection } from '@/components/status-section'
import { ResponseForm } from './response-form'
import { getStatusGroup } from '@/lib/utils'
import type { EmployeeWithStatus, Response } from '@/types'

export default async function DashboardPage() {
  const employee = await getCurrentEmployee()
  if (!employee) redirect('/login')

  const admin = createAdminClient()

  // Always show the single latest event, regardless of age.
  const { data: latestEvent } = await admin
    .from('events')
    .select('*')
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let employeesWithStatus: EmployeeWithStatus[] = []
  let myResponse: Response | null = null
  let totalCount = 0
  let answeredCount = 0

  if (latestEvent) {
    const [{ data: allEmployees }, { data: allResponses }] = await Promise.all([
      admin
        .from('employees')
        .select('employee_number, name, email, department')
        .eq('is_active', true)
        .order('employee_number'),
      admin
        .from('responses')
        .select('*')
        .eq('event_id', latestEvent.event_id)
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

    totalCount = employees.length
    answeredCount = [...latestByEmployee.values()].filter((r) => r.self_status !== null).length
    myResponse = latestByEmployee.get(employee.employee_number) ?? null

    employeesWithStatus = employees.map((emp) => {
      const latestResponse = latestByEmployee.get(emp.employee_number) ?? null
      return { ...emp, latestResponse, statusGroup: getStatusGroup(latestResponse) }
    })
  }

  return (
    <div className="space-y-6">
      {latestEvent ? (
        <>
          <EventSummary
            event={latestEvent}
            answeredCount={answeredCount}
            totalCount={totalCount}
          />

          <section className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-medium text-gray-500 mb-3">あなたの回答状況</h2>
            {myResponse?.self_status ? (
              <p className="text-sm text-emerald-700 font-medium mb-3">✓ 回答済み</p>
            ) : (
              <p className="text-sm text-gray-400 mb-3">まだ回答していません</p>
            )}
            <ResponseForm
              eventId={latestEvent.event_id}
              hasAnswered={!!myResponse?.self_status}
            />
          </section>

          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              回答状況一覧
            </h2>
            <StatusSection employees={employeesWithStatus} />
          </section>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            現在イベントはありません
          </h2>
          <p className="text-sm text-gray-400">
            安否確認が発報されると、ここに表示されます。
          </p>
        </div>
      )}
    </div>
  )
}
