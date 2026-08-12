'use server'

import { syncEmployees, type SyncResult } from '@/lib/employee-sync'

export type SyncActionState = SyncResult | null

export async function syncEmployeesAction(
  _prevState: SyncActionState,
  _formData: FormData
): Promise<SyncResult> {
  return syncEmployees()
}
