import { createAdminClient } from '@/lib/supabase/admin'
import { DispatchManager } from './dispatch-manager'

export default async function DispatchPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('employees')
    .select('employee_number, name, department, is_active, updated_at')
    .order('is_active', { ascending: false })
    .order('department', { nullsFirst: false })
    .order('employee_number')

  const employees = (data ?? []).sort((a, b) => {
    // 1. 在籍状況（在籍中が先）
    const byActive = (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0)
    if (byActive !== 0) return byActive
    // 2. 部署名（日本語ロケール順、null は後ろ）
    if (a.department === null && b.department !== null) return 1
    if (a.department !== null && b.department === null) return -1
    const byDept = (a.department ?? '').localeCompare(b.department ?? '', 'ja')
    if (byDept !== 0) return byDept
    // 3. 社員番号（数値変換できる場合は数値順）
    const numA = Number(a.employee_number)
    const numB = Number(b.employee_number)
    return !isNaN(numA) && !isNaN(numB)
      ? numA - numB
      : a.employee_number.localeCompare(b.employee_number, 'ja')
  })

  const lastUpdatedAt = employees.length > 0
    ? employees.reduce((max, e) => e.updated_at > max ? e.updated_at : max, employees[0].updated_at)
    : null

  return <DispatchManager employees={employees} lastUpdatedAt={lastUpdatedAt} />
}
