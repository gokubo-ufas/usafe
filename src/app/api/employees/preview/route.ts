import { createAdminClient } from '@/lib/supabase/admin'

export type EmployeeRow = {
  employee_number: string
  name: string
  email: string
  department: string | null
  is_active: boolean
}

export type DiffEntry =
  | { kind: 'added';       row: EmployeeRow }
  | { kind: 'deactivated'; row: EmployeeRow }
  | { kind: 'changed';     before: EmployeeRow; after: EmployeeRow }

export type PreviewResult =
  | { ok: true;  current: EmployeeRow[]; incoming: EmployeeRow[]; diff: DiffEntry[] }
  | { ok: false; error: string }

export async function GET(): Promise<Response> {
  const gasUrl = process.env.GAS_WEBAPP_URL
  if (!gasUrl) {
    return Response.json({ ok: false, error: 'GAS_WEBAPP_URL not configured' } satisfies PreviewResult, { status: 503 })
  }

  let incoming: EmployeeRow[]
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 15_000)
    const res = await fetch(gasUrl, { signal: controller.signal, cache: 'no-store', redirect: 'follow' })
    clearTimeout(id)
    if (!res.ok) throw new Error(`GAS returned ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`)
    incoming = (await res.json()) as EmployeeRow[]
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[preview] GAS fetch error:', detail)
    const userMsg = detail.includes('abort')
      ? 'GASへの接続がタイムアウトしました（15秒）'
      : `GASからの取得に失敗しました（${detail}）`
    return Response.json({ ok: false, error: userMsg } satisfies PreviewResult, { status: 502 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('employees')
    .select('employee_number, name, email, department, is_active')
    .order('employee_number')

  if (error) {
    return Response.json({ ok: false, error: 'DB取得に失敗しました' } satisfies PreviewResult, { status: 500 })
  }

  const current = (data ?? []) as EmployeeRow[]
  const currentMap = new Map(current.map((e) => [e.employee_number, e]))
  const incomingMap = new Map(incoming.map((e) => [e.employee_number, e]))

  const diff: DiffEntry[] = []

  for (const next of incoming) {
    const prev = currentMap.get(next.employee_number)
    if (!prev) {
      // DBにない新規社員（在籍中のみ追加対象、退職済みはスキップ）
      if (next.is_active) diff.push({ kind: 'added', row: next })
    } else if (prev.is_active && !next.is_active) {
      // 在籍中 → 退職済み
      diff.push({ kind: 'deactivated', row: next })
    } else if (
      prev.name !== next.name ||
      prev.email !== next.email ||
      prev.department !== next.department ||
      (!prev.is_active && next.is_active) // 退職済み → 在籍中（再雇用）
    ) {
      diff.push({ kind: 'changed', before: prev, after: next })
    }
  }

  // スプレッドシートから完全に消えた在籍中社員
  for (const prev of current) {
    if (prev.is_active && !incomingMap.has(prev.employee_number)) {
      diff.push({ kind: 'deactivated', row: prev })
    }
  }

  return Response.json({ ok: true, current, incoming, diff } satisfies PreviewResult)
}
