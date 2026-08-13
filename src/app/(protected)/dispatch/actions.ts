'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentEmployee } from '@/lib/auth/session'
import { postSlackAlert } from '@/lib/slack'
import { redirect } from 'next/navigation'
import type { EmployeeRow } from '@/app/api/employees/preview/route'

type State = {
  error?: string
  success?: string
  slackFailed?: boolean
}

export type SyncState = { ok: boolean; error?: string }

export async function applySyncFromGAS(incoming: EmployeeRow[]): Promise<SyncState> {
  const employee = await getCurrentEmployee()
  if (!employee) redirect('/login')

  const admin = createAdminClient()
  const { error } = await admin.rpc('sync_employees_from_gas', { p_employees: incoming })

  if (error) {
    console.error('[applySyncFromGAS]', error.message)
    return { ok: false, error: '同期に失敗しました。もう一度お試しください。' }
  }

  return { ok: true }
}

export async function dispatchDrill(_prev: State, formData: FormData): Promise<State> {
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
    console.error('[dispatchDrill]', error.message)
    return { error: '発報に失敗しました。もう一度お試しください。' }
  }

  const issuedAt = new Date()
  const slackResult = await postSlackAlert({ type: 'test', comment, issuedAt })

  if (slackResult.ok) {
    return { success: '安否確認を発報しました。' }
  }

  return {
    success: '安否確認は作成されましたが、Slackへの通知に失敗しました。',
    slackFailed: true,
  }
}

export async function dispatchProduction(_prev: State, formData: FormData): Promise<State> {
  const employee = await getCurrentEmployee()
  if (!employee) redirect('/login')

  const comment = ((formData.get('comment') as string) ?? '').trim() || null
  if (comment && comment.length > 50) {
    return { error: 'コメントは50文字以内で入力してください' }
  }

  const admin = createAdminClient()
  const { error } = await admin.rpc('dispatch_alert', {
    p_event_type: 'earthquake',
    p_issuer: employee.name,
    p_comment: comment,
  })

  if (error) {
    console.error('[dispatchProduction]', error.message)
    return { error: '発報に失敗しました。もう一度お試しください。' }
  }

  const issuedAt = new Date()
  const slackResult = await postSlackAlert({ type: 'earthquake', comment, issuedAt })

  if (slackResult.ok) {
    return { success: '安否確認を発報しました。' }
  }

  return {
    success: '安否確認は作成されましたが、Slackへの通知に失敗しました。',
    slackFailed: true,
  }
}
