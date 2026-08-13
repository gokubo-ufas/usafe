import type { Event, Response, StatusGroup } from '@/types'

// Display classification for event cards / badges.
// earthquake + earthquake_info_id IS NULL  → manual production dispatch
// earthquake + earthquake_info_id IS NOT NULL → automatic seismic alert
export type DisplayEventType = 'test' | 'manual' | 'earthquake'

export function getDisplayEventType(
  event: Pick<Event, 'event_type' | 'earthquake_info_id'>,
): DisplayEventType {
  if (event.event_type === 'test') return 'test'
  return event.earthquake_info_id === null ? 'manual' : 'earthquake'
}

export const DISPLAY_EVENT_TYPE_CONFIG: Record<
  DisplayEventType,
  { label: string; className: string }
> = {
  test:       { label: '🟡 訓練', className: 'bg-amber-400 text-amber-950' },
  manual:     { label: '🔴 本番', className: 'bg-red-500 text-white'       },
  earthquake: { label: '🔴 本番', className: 'bg-red-500 text-white'       },
}

export function getStatusGroup(response: Response | null): StatusGroup {
  if (!response || response.self_status === null) return 'unanswered'
  const { self_status, family_status } = response
  if (
    self_status === 'injured' ||
    self_status === 'need_rescue' ||
    family_status === 'injured' ||
    family_status === 'need_rescue'
  )
    return 'critical'
  if (family_status === 'checking') return 'checking'
  if (self_status === 'safe' && (family_status === 'safe' || family_status === 'not_applicable'))
    return 'safe'
  return 'unanswered'
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isWithin24Hours(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000
}

export const SELF_STATUS_LABELS: Record<string, string> = {
  safe: '無事',
  injured: '負傷',
  need_rescue: '救助が必要',
}

export const FAMILY_STATUS_LABELS: Record<string, string> = {
  safe: '無事',
  injured: '負傷',
  need_rescue: '救助が必要',
  checking: '安否確認中',
  not_applicable: '対象家族なし',
}

export const WORK_STATUS_LABELS: Record<string, string> = {
  available: '対応可能',
  unavailable: '対応困難',
}

export const INTENSITY_MAP: Record<number, string> = {
  10: '1', 20: '2', 30: '3', 40: '4',
  45: '5弱', 50: '5強', 55: '6弱', 60: '6強', 70: '7',
}
export function formatIntensity(n: number): string {
  return INTENSITY_MAP[n] ?? String(n)
}

export const STATUS_GROUP_CONFIG = {
  critical: {
    label: '要対応',
    description: '本人またはご家族に負傷・救助が必要な方',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badgeClass: 'bg-red-100 text-red-700',
    dotClass: 'bg-red-500',
  },
  checking: {
    label: '確認中',
    description: 'ご家族の安全を確認中の方',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-700',
    dotClass: 'bg-amber-500',
  },
  unanswered: {
    label: '未回答',
    description: 'まだ安否確認への回答がない方',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    badgeClass: 'bg-gray-100 text-gray-600',
    dotClass: 'bg-gray-400',
  },
  safe: {
    label: '無事',
    description: '本人・ご家族ともに安全が確認できている方',
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
} as const
