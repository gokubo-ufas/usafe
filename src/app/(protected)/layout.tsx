import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { getAuthUser, getCurrentEmployee } from '@/lib/auth/session'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const employee = await getCurrentEmployee()
  if (!employee) {
    const user = await getAuthUser()
    redirect(user ? '/not-registered' : '/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
