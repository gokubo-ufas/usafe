import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signOut } from '@/app/auth/actions'
import { SyncForm } from './sync-form'

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
      <div className="max-w-lg mx-auto space-y-6">
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

        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            社員マスタ管理
          </h2>
          <p className="text-xs text-gray-400 mb-4">開発確認用 — 後続フェーズでテスト発報画面へ統合予定</p>
          <SyncForm />
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
