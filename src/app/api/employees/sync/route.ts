import { type NextRequest } from 'next/server'
import { timingSafeEqual, createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// Disaster resilience principle:
// This endpoint is the ONLY way to update the employees table from outside.
// All alert dispatch (earthquake / manual / test) reads ONLY from the
// employees table — never from Google Sheets or GAS.
// A GAS/Sheets outage must never block alert sending.

const MAX_EMPLOYEES = 1000
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function timingSafeCompare(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

type EmployeeInput = {
  employee_number: string
  name: string
  email: string
  department?: string | null
  is_active: boolean
}

type ValidationResult =
  | { valid: true; data: EmployeeInput[] }
  | { valid: false; error: string }

function validateEmployees(employees: unknown): ValidationResult {
  if (!Array.isArray(employees)) {
    return { valid: false, error: 'employees must be an array' }
  }
  if (employees.length === 0) {
    return { valid: false, error: 'employees must not be empty' }
  }
  if (employees.length > MAX_EMPLOYEES) {
    return { valid: false, error: `Too many employees (max ${MAX_EMPLOYEES})` }
  }

  const seenNumbers = new Set<string>()

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i] as Record<string, unknown>

    const num = typeof emp.employee_number === 'string' ? emp.employee_number.trim() : ''
    if (!num) {
      return { valid: false, error: `employees[${i}]: employee_number is required` }
    }
    if (seenNumbers.has(num)) {
      return { valid: false, error: `Duplicate employee_number: ${num}` }
    }
    seenNumbers.add(num)

    if (!emp.name || typeof emp.name !== 'string' || !emp.name.trim()) {
      return { valid: false, error: `employees[${i}]: name is required` }
    }

    const email = typeof emp.email === 'string' ? emp.email.trim().toLowerCase() : ''
    if (!email || !EMAIL_REGEX.test(email)) {
      return { valid: false, error: `employees[${i}]: valid email is required` }
    }

    if (typeof emp.is_active !== 'boolean') {
      return { valid: false, error: `employees[${i}]: is_active must be a boolean` }
    }
  }

  return {
    valid: true,
    data: (employees as EmployeeInput[]).map((emp) => ({
      employee_number: emp.employee_number.trim(),
      name: emp.name.trim(),
      email: emp.email.trim().toLowerCase(),
      department: emp.department?.trim() || null,
      is_active: emp.is_active,
    })),
  }
}

export async function POST(request: NextRequest) {
  // 1. Verify GAS_SYNC_SECRET is configured
  const secret = process.env.GAS_SYNC_SECRET
  if (!secret) {
    console.error('[sync-employees] GAS_SYNC_SECRET is not configured')
    return Response.json({ success: false, error: 'Server configuration error' }, { status: 500 })
  }

  // 2. Authenticate — timing-safe comparison to prevent timing attacks
  const authHeader = request.headers.get('Authorization') ?? ''
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!provided || !timingSafeCompare(provided, secret)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Parse JSON body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { employees } = (body as { employees?: unknown }) ?? {}

  // 4. Validate input — DB is never touched if validation fails
  const validation = validateEmployees(employees)
  if (!validation.valid) {
    return Response.json({ success: false, error: validation.error }, { status: 400 })
  }

  // 5. Execute atomic sync via PostgreSQL function
  //    The entire upsert + deactivation runs in a single transaction.
  //    Any DB error rolls back all changes automatically.
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('sync_employees_from_gas', {
    p_employees: validation.data,
  })

  if (error) {
    console.error('[sync-employees] RPC error:', error.message)
    return Response.json({ success: false, error: 'Sync failed' }, { status: 500 })
  }

  return Response.json(data)
}
