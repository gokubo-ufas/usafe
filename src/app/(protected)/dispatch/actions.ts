'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentEmployee } from '@/lib/auth/session'
import { postSlackAlert } from '@/lib/slack'
import { parseGasRows } from '@/lib/gas-parse'
import { redirect } from 'next/navigation'

type State = {
  error?: string
  success?: string
  slackFailed?: boolean
}

export type SyncResult = {
  ok: boolean
  error?: string
  received?: number
  active?: number
}

export async function fetchAndSyncFromGAS(): Promise<SyncResult> {
  const employee = await getCurrentEmployee()
  if (!employee) redirect('/login')

  const gasUrl = process.env.GAS_WEBAPP_URL
  if (!gasUrl) return { ok: false, error: 'GAS_WEBAPP_URL が設定されていません' }

  let rows: unknown[][]
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 15_000)
    const res = await fetch(gasUrl, { signal: controller.signal, cache: 'no-store', redirect: 'follow' })
    clearTimeout(id)
    if (!res.ok) throw new Error(`GAS returned ${res.status}`)
    rows = (await res.json()) as unknown[][]
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[fetchAndSyncFromGAS] GAS fetch error:', detail)
    return {
      ok: false,
      error: detail.includes('abort')
        ? 'GASへの接続がタイムアウトしました（15秒）'
        : 'スプレッドシートからの取得に失敗しました',
    }
  }

  const employees = parseGasRows(rows)
  if (employees.length === 0) {
    return { ok: false, error: '有効な社員データが取得できませんでした' }
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('sync_employees_from_gas', { p_employees: employees })
  if (error) {
    console.error('[fetchAndSyncFromGAS] RPC error:', error.message, error.details, error.hint)
    return { ok: false, error: 'sync_failed' }
  }

  return { ok: true, received: data.received, active: data.active }
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

  const slackResult = await postSlackAlert({ type: 'test', comment, issuedAt: new Date() })

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

  const slackResult = await postSlackAlert({ type: 'earthquake', comment, issuedAt: new Date() })

  if (slackResult.ok) {
    return { success: '安否確認を発報しました。' }
  }

  return {
    success: '安否確認は作成されましたが、Slackへの通知に失敗しました。',
    slackFailed: true,
  }
}
