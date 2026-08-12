import { createAdminClient } from '@/lib/supabase/admin'
import { DispatchForm } from './dispatch-form'

export default async function DispatchPage() {
  const admin = createAdminClient()
  const { count } = await admin
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">手動発報</h1>
        <p className="text-sm text-gray-500 mt-0.5">発報種別を選択してください。</p>
      </div>
      <DispatchForm employeeCount={count ?? 0} />
    </div>
  )
}
