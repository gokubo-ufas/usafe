import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Verify the user is a registered active employee
  const admin = createAdminClient()
  const { data: employee } = await admin
    .from('employees')
    .select('employee_number')
    .eq('is_active', true)
    .ilike('email', data.user.email)
    .single()

  if (!employee) {
    // Sign out and redirect to the access-denied page
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/not-registered`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
