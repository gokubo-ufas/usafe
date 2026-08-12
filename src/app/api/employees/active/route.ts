import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('employees')
    .select('employee_number, name, department')
    .eq('is_active', true)
    .order('department', { nullsFirst: false })
    .order('employee_number')

  if (error) {
    return Response.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }

  return Response.json(data)
}
