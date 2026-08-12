import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signOut } from '@/app/auth/actions'

// Disaster resilience principle:
// Alert dispatch (earthquake / manual / test) reads ONLY from the employees table.
// It never contacts Google Sheets or GAS — a Sheets outage must not block alerts.
// Employee data is kept current via the GAS push sync (POST /api/employees/sync).

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) redirect('/login')

  const admin = createAdminClient()
  const { data: employee } = await admin
    .from('employees')
    .select('employee_number, name, email, department')
    .eq('is_active', true)
    .ilike('email', user.email)
    .single()

  if (!employee) redirect('/not-registered')

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-4">U-Safe</h1>
          <dl className="space-y-3 text-sm">
            <InfoRow label="氏名" value={employee.name} />
            <InfoRow label="社員番号" value={employee.employee_number} />
            <InfoRow label="部門" value={employee.department ?? '—'} />
            <InfoRow label="メールアドレス" value={employee.email} />
          </dl>
          <form action={signOut} className="mt-6">
            <button type="submit" className="text-sm text-red-600 hover:underline">
              ログアウト
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-28 shrink-0 text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium">{value}</dd>
    </div>
  )
}
