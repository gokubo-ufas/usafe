'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentEmployee } from '@/lib/auth/session'

type State = { error?: string }

export async function submitResponse(_prev: State, formData: FormData): Promise<State> {
  const employee = await getCurrentEmployee()
  if (!employee) redirect('/login')

  const eventId = formData.get('event_id') as string
  const selfStatus = formData.get('self_status') as string
  const familyStatus = formData.get('family_status') as string
  const workStatus = formData.get('work_status') as string
  const comment = ((formData.get('comment') as string) ?? '').trim() || null

  if (!eventId || !selfStatus || !familyStatus || !workStatus) {
    return { error: '全ての項目を入力してください' }
  }
  if (comment && comment.length > 50) {
    return { error: 'コメントは50文字以内で入力してください' }
  }

  const admin = createAdminClient()

  // Only the latest event accepts responses.
  // If a newer event was dispatched after the page loaded, reject gracefully.
  const { data: latestEvent } = await admin
    .from('events')
    .select('event_id')
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestEvent) return { error: 'イベントが見つかりません' }
  if (latestEvent.event_id !== eventId) {
    return {
      error:
        '新しいイベントが発報されました。ホームに戻って最新の安否確認に回答してください。',
    }
  }

  const { error: upsertError } = await admin
    .from('responses')
    .upsert({
      event_id: eventId,
      employee_number: employee.employee_number,
      name: employee.name,
      department: employee.department,
      self_status: selfStatus,
      family_status: familyStatus,
      work_status: workStatus,
      comment,
    }, { onConflict: 'event_id,employee_number' })

  if (upsertError) {
    console.error('[submitResponse]', upsertError.message)
    return { error: '送信に失敗しました。もう一度お試しください。' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/events', 'layout')
  return {}
}
