import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Employee } from '@/types'

export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export const getCurrentEmployee = cache(async (): Promise<Employee | null> => {
  const user = await getAuthUser()
  if (!user?.email) return null
  const admin = createAdminClient()
  const { data } = await admin
    .from('employees')
    .select('employee_number, name, email, department')
    .eq('is_active', true)
    .ilike('email', user.email)
    .single()
  return data
})
