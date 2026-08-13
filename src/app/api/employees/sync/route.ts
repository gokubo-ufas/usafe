import { type NextRequest } from 'next/server'
import { timingSafeEqual, createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_ROWS = 1000

type EmployeeRow = {
  employee_number: string
  name: string
  email: string
  department: string | null
  is_active: boolean
}

// GASの生2次元配列（A〜E列）をEmployeeRowに変換。
// 列順: [社員番号, 氏名, メール, 部門, 退職FLG]
// 空行・メールに@なし行・重複社員番号はスキップ。
// 退職FLG: 空欄=在籍(true)、●=退職(false)
function parseGasRows(rows: unknown[][]): EmployeeRow[] {
  const result: EmployeeRow[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    const employeeNumber = String(row[0] ?? '').trim()
    const name           = String(row[1] ?? '').trim()
    const email          = String(row[2] ?? '').trim().toLowerCase()
    const department     = String(row[3] ?? '').trim() || null
    const retiredFlag    = String(row[4] ?? '').trim()

    if (!employeeNumber || !name || !email || !email.includes('@')) continue
    if (seen.has(employeeNumber)) continue
    seen.add(employeeNumber)

    result.push({
      employee_number: employeeNumber,
      name,
      email,
      department,
      is_active: retiredFlag !== '●',
    })
  }
  return result
}

function timingSafeCompare(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export async function POST(request: NextRequest) {
  const secret = process.env.GAS_SYNC_SECRET
  if (!secret) {
    console.error('[sync-employees] GAS_SYNC_SECRET is not configured')
    return Response.json({ success: false, error: 'Server configuration error' }, { status: 500 })
  }

  const authHeader = request.headers.get('Authorization') ?? ''
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!provided || !timingSafeCompare(provided, secret)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { rows } = (body as { rows?: unknown }) ?? {}
  if (!Array.isArray(rows)) {
    return Response.json({ success: false, error: 'rows must be an array' }, { status: 400 })
  }
  if (rows.length > MAX_ROWS) {
    return Response.json({ success: false, error: `Too many rows (max ${MAX_ROWS})` }, { status: 400 })
  }

  const employees = parseGasRows(rows as unknown[][])
  if (employees.length === 0) {
    return Response.json({ success: false, error: '有効な社員データが見つかりません' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('sync_employees_from_gas', {
    p_employees: employees,
  })

  if (error) {
    console.error('[sync-employees] RPC error:', error.message, error.details, error.hint)
    return Response.json({ success: false, error: `${error.message} | ${error.details ?? ''} | ${error.hint ?? ''}` }, { status: 500 })
  }

  return Response.json(data)
}
