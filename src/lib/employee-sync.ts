import 'server-only'
import { fetchEmployeesFromSheet } from './google/sheets'
import { createAdminClient } from './supabase/admin'

export type SyncResult =
  | { success: true; count: number }
  | { success: false; error: string }

export async function syncEmployees(): Promise<SyncResult> {
  let sheetEmployees
  try {
    sheetEmployees = await fetchEmployeesFromSheet()
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : '社員マスタの取得に失敗しました',
    }
  }

  if (sheetEmployees.length === 0) {
    return { success: false, error: 'スプレッドシートから社員データを取得できませんでした' }
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  const sheetNumbers = new Set(sheetEmployees.map((e) => e.employee_number))

  // Upsert employees from sheet
  const upsertData = sheetEmployees.map((e) => ({
    employee_number: e.employee_number,
    name: e.name,
    email: e.email,
    department: e.department,
    is_active: e.is_active,
    updated_at: now,
  }))

  const { error: upsertError } = await admin
    .from('employees')
    .upsert(upsertData, { onConflict: 'employee_number' })

  if (upsertError) {
    return { success: false, error: `社員データの更新に失敗しました: ${upsertError.message}` }
  }

  // Deactivate employees present in DB but absent from sheet
  const { data: activeInDb } = await admin
    .from('employees')
    .select('employee_number')
    .eq('is_active', true)

  const toDeactivate = (activeInDb ?? [])
    .map((e: { employee_number: string }) => e.employee_number)
    .filter((num) => !sheetNumbers.has(num))

  if (toDeactivate.length > 0) {
    const { error: deactivateError } = await admin
      .from('employees')
      .update({ is_active: false, updated_at: now })
      .in('employee_number', toDeactivate)

    if (deactivateError) {
      return { success: false, error: `退職者の無効化に失敗しました: ${deactivateError.message}` }
    }
  }

  return { success: true, count: sheetEmployees.length }
}
