'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentEmployee } from '@/lib/auth/session'
import { isWithin24Hours } from '@/lib/utils'

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

  const { data: event } = await admin
    .from('events')
    .select('issued_at')
    .eq('event_id', eventId)
    .single()

  if (!event) return { error: 'イベントが見つかりません' }
  if (!isWithin24Hours(event.issued_at)) return { error: 'このイベントの受付は終了しました（発報から24時間経過）' }

  const { error: insertError } = await admin.from('responses').insert({
    event_id: eventId,
    employee_number: employee.employee_number,
    self_status: selfStatus,
    family_status: familyStatus,
    work_status: workStatus,
    comment,
  })

  if (insertError) {
    console.error('[submitResponse]', insertError.message)
    return { error: '送信に失敗しました。もう一度お試しください。' }
  }

  revalidatePath('/dashboard')
  return {}
}
