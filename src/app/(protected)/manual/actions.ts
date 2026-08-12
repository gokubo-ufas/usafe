'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentEmployee } from '@/lib/auth/session'

type State = { error?: string }

export async function dispatchManualAlert(_prev: State, formData: FormData): Promise<State> {
  const employee = await getCurrentEmployee()
  if (!employee) redirect('/login')

  const comment = ((formData.get('comment') as string) ?? '').trim() || null
  if (comment && comment.length > 50) {
    return { error: 'コメントは50文字以内で入力してください' }
  }

  const admin = createAdminClient()
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: activeEvent } = await admin
    .from('events')
    .select('event_id')
    .gte('issued_at', twentyFourHoursAgo)
    .limit(1)
    .maybeSingle()

  if (activeEvent) {
    return { error: 'アクティブなイベントが既に存在します。24時間経過後に再試行してください。' }
  }

  const { error } = await admin.rpc('dispatch_alert', {
    p_event_type: 'manual',
    p_issuer: employee.name,
    p_comment: comment,
  })

  if (error) {
    console.error('[dispatchManualAlert]', error.message)
    return { error: '発報に失敗しました。もう一度お試しください。' }
  }

  redirect('/dashboard')
}
