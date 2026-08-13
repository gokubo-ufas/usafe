import { createAdminClient } from '@/lib/supabase/admin'
import { DispatchManager } from './dispatch-manager'

export default async function DispatchPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('employees')
    .select('employee_number, name, department, is_active, updated_at')
    .order('employee_number')
    .order('department', { nullsFirst: false })
    .order('is_active', { ascending: false })

  const employees = (data ?? []).sort((a, b) => {
    const numA = Number(a.employee_number)
    const numB = Number(b.employee_number)
    const byNum = !isNaN(numA) && !isNaN(numB)
      ? numA - numB
      : a.employee_number.localeCompare(b.employee_number, 'ja')
    if (byNum !== 0) return byNum
    const byDept = (a.department ?? '').localeCompare(b.department ?? '', 'ja')
    if (byDept !== 0) return byDept
    return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0)
  })

  const lastUpdatedAt = employees.length > 0
    ? employees.reduce((max, e) => e.updated_at > max ? e.updated_at : max, employees[0].updated_at)
    : null

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">発報管理</h1>
        <p className="text-sm text-gray-500 mt-0.5">発報先を確認・選択して発報してください。</p>
      </div>
      <DispatchManager employees={employees} lastUpdatedAt={lastUpdatedAt} />
    </div>
  )
}
