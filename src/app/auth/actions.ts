'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

function getSiteUrl(host: string | null, proto: string | null): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (host) return `${proto ?? 'https'}://${host}`
  return 'http://localhost:3000'
}

export async function signInWithGoogle() {
  const headersList = await headers()
  const siteUrl = getSiteUrl(
    headersList.get('host'),
    headersList.get('x-forwarded-proto')
  )

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${siteUrl}/auth/callback` },
  })

  if (error) redirect('/login?error=oauth_failed')
  if (data.url) redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
