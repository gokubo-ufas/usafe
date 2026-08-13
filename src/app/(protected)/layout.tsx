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
      <main className="max-w-lg mx-auto pb-10">{children}</main>
    </div>
  )
}
