import { createClient } from '@supabase/supabase-js'

// Server-only: never import this file from client components or browser code.
// SUPABASE_SERVICE_ROLE_KEY bypasses Row Level Security.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
