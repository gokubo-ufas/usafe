/**
 * テスト用地震イベントをINSERTするスクリプト
 * 実行: npx tsx scripts/seed-test-event.ts
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const EVENT = {
  p_event_type:    'earthquake',
  p_issuer:        '自動',
  p_eq_info_id:    'jma20260813_test_001',
  p_max_intensity: 55,           // 震度6弱
  p_epicenter:     '神奈川県西部',
  p_comment:       null,
  p_employee_numbers: null,      // 全社員対象
}

async function main() {
  console.log('Inserting test earthquake event...')
  console.log(JSON.stringify(EVENT, null, 2))

  const { data, error } = await admin.rpc('dispatch_alert', EVENT)

  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }

  console.log('Created event_id:', data)
  console.log('Done.')
}

main()
