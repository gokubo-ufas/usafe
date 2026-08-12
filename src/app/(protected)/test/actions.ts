'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentEmployee } from '@/lib/auth/session'

type State = { error?: string }

export async function dispatchTestAlert(_prev: State, formData: FormData): Promise<State> {
  const employee = await getCurrentEmployee()
  if (!employee) redirect('/login')

  const comment = ((formData.get('comment') as string) ?? '').trim() || null
  if (comment && comment.length > 50) {
    return { error: 'コメントは50文字以内で入力してください' }
  }

  const admin = createAdminClient()

  const { error } = await admin.rpc('dispatch_alert', {
    p_event_type: 'test',
    p_issuer: employee.name,
    p_comment: comment,
  })

  if (error) {
    console.error('[dispatchTestAlert]', error.message)
    return { error: '発報に失敗しました。もう一度お試しください。' }
  }

  redirect('/dashboard')
}
