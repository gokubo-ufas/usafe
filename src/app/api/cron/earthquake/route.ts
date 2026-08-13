import { type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { postSlackAlert } from '@/lib/slack'

const P2P_API_URL = 'https://api.p2pquake.net/v2/history?codes=551&limit=10'

type P2PQuakeEvent = {
  id: string
  code: number
  time: string
  earthquake?: {
    time?: string
    hypocenter?: { name?: string }
    maxScale: number
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // P2P地震情報から最新イベントを取得
  let quakes: P2PQuakeEvent[]
  try {
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 15_000)
    const res = await fetch(P2P_API_URL, { cache: 'no-store', signal: controller.signal })
    clearTimeout(tid)
    if (!res.ok) throw new Error(`P2P API returned ${res.status}`)
    quakes = await res.json()
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[cron/earthquake] fetch error:', detail)
    return Response.json({ error: 'fetch_failed', detail }, { status: 500 })
  }

  // code=551（地震情報）かつ earthquake データがあるものを処理（閾値なし）
  const qualifying = quakes.filter((q) => q.code === 551 && q.earthquake != null)

  if (qualifying.length === 0) {
    return Response.json({ dispatched: 0, reason: 'no_qualifying_events' })
  }

  const admin = createAdminClient()
  let dispatched = 0

  for (const eq of qualifying) {
    const maxScale  = eq.earthquake!.maxScale
    const epicenter = eq.earthquake?.hypocenter?.name ?? null
    const eqTimeStr = (eq.earthquake?.time ?? eq.time).replace(/\//g, '-')

    // 同じ地震の重複発報を防ぐ
    const { data: existing } = await admin
      .from('events')
      .select('event_id')
      .eq('earthquake_info_id', eq.id)
      .maybeSingle()

    if (existing) continue

    const { error } = await admin.rpc('dispatch_alert', {
      p_event_type:      'earthquake',
      p_issuer:          '自動',
      p_comment:         null,
      p_eq_info_id:      eq.id,
      p_max_intensity:   maxScale,
      p_epicenter:       epicenter,
    })

    if (error) {
      console.error('[cron/earthquake] dispatch_alert error:', error.message)
      continue
    }

    await postSlackAlert({
      type:         'earthquake',
      comment:      null,
      issuedAt:     new Date(eqTimeStr),
      maxIntensity: maxScale,
      epicenter,
    })

    dispatched++
    console.log(`[cron/earthquake] dispatched: id=${eq.id} maxScale=${maxScale} epicenter=${epicenter}`)
  }

  return Response.json({ dispatched, checked: qualifying.length })
}
