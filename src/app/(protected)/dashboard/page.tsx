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
    const [{ data: allResponses }, { data: allEmployees }] = await Promise.all([
      admin
        .from('responses')
        .select('*')
        .eq('event_id', latestEvent.event_id)
        .order('created_at', { ascending: false }),
      admin
        .from('employees')
        .select('employee_number, name, email, department'),
    ])

    const responses = (allResponses ?? []) as Response[]
    const employeeMap = new Map((allEmployees ?? []).map((e) => [e.employee_number, e]))

    // responses をベースに最新1件/社員を確定（発報当時の対象者が基準）
    const latestByEmployee = new Map<string, Response>()
    for (const r of responses) {
      if (!latestByEmployee.has(r.employee_number)) {
        latestByEmployee.set(r.employee_number, r)
      }
    }

    totalCount = latestByEmployee.size
    answeredCount = [...latestByEmployee.values()].filter((r) => r.self_status !== null).length
    myResponse = latestByEmployee.get(employee.employee_number) ?? null

    employeesWithStatus = [...latestByEmployee.entries()]
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
  }

  const bgClass = latestEvent
    ? latestEvent.event_type === 'test' ? 'bg-amber-50' : 'bg-red-50'
    : 'bg-white'

  return (
    <div className="space-y-4">
      <div className={`fixed inset-0 -z-10 ${bgClass}`} />
      {latestEvent ? (
        <>
          <EventSummary
            event={latestEvent}
            answeredCount={answeredCount}
            totalCount={totalCount}
          />

          <StatusSection
            employees={employeesWithStatus}
            middleSlot={
              <div className="bg-white rounded-2xl shadow-sm px-5 py-3 space-y-2 border border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-emerald-700 shrink-0">あなたの回答</h2>
                  {myResponse?.self_status ? (
                    <span className="text-xs font-bold text-white bg-emerald-500 px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                      ✓ 回答済み
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-red-600 animate-pulse whitespace-nowrap">急いでください！</span>
                      <span className="text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-full shadow-sm animate-pulse whitespace-nowrap">
                        未回答
                      </span>
                    </div>
                  )}
                </div>
                <ResponseForm
                  eventId={latestEvent.event_id}
                  hasAnswered={!!myResponse?.self_status}
                  currentResponse={myResponse}
                />
              </div>
            }
          />
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">現在イベントはありません</h2>
          <p className="text-sm text-gray-400">安否確認が発報されると、ここに表示されます。</p>
        </div>
      )}
    </div>
  )
}
