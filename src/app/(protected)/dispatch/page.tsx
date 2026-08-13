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

  const employees = data ?? []

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
