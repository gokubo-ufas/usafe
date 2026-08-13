import type { Event } from '@/types'
import { formatDateTime, formatIntensity, getDisplayEventType } from '@/lib/utils'

type Props = {
  event: Event
  answeredCount: number
  totalCount: number
}

export function EventSummary({ event, answeredCount, totalCount }: Props) {
  const displayType = getDisplayEventType(event)
  const isDrill = displayType === 'test'
  const pct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0

  return (
    <div className="bg-white border-y border-gray-100 overflow-hidden">
      {/* グレーヘッダー */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-1.5 py-0.5 ${isDrill ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
              {isDrill ? '🟡 訓練' : '🔴 本番'}
            </span>
            <span className="text-gray-400 text-xs tabular-nums whitespace-nowrap">{formatDateTime(event.issued_at)}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-gray-900 font-black text-2xl tabular-nums leading-none">{answeredCount}</span>
            <span className="text-gray-400 text-sm"> / {totalCount}名</span>
          </div>
        </div>
        <p className="text-sm font-bold text-gray-800 mt-1">
          {isDrill ? '⚠️ これは避難訓練です' : '🚨 これは訓練ではありません'}
        </p>
        <p className="text-xs text-gray-400 mt-1">発報者：{event.issuer ?? '自動'}</p>
      </div>

      {/* 地震情報（カラー） */}
      {event.max_intensity != null ? (
        <div className={`px-4 py-4 ${isDrill ? 'bg-amber-400' : 'bg-red-600'}`}>
          <p className="text-white/80 text-xs font-semibold">最大震度</p>
          <p className="text-white font-black leading-none tracking-tighter mt-0.5"
             style={{ fontSize: 'clamp(3rem, 15vw, 4.5rem)' }}>
            {formatIntensity(event.max_intensity)}
          </p>
          {event.epicenter && <p className="text-white text-base font-bold mt-1">{event.epicenter}</p>}
          {event.comment && <p className="text-white/80 text-sm mt-2">{event.comment}</p>}
        </div>
      ) : event.comment ? (
        <div className={`px-4 py-4 ${isDrill ? 'bg-amber-400' : 'bg-red-600'}`}>
          <p className="text-white text-base font-bold leading-snug">{event.comment}</p>
        </div>
      ) : null}

      {/* 進捗バー */}
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-gray-500 font-medium">回答率</span>
          <span className="text-xs text-gray-700 font-bold tabular-nums">{pct}%　{answeredCount} / {totalCount}名</span>
        </div>
        <div className="h-2 bg-gray-100 overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100
                ? 'linear-gradient(90deg, #10b981, #059669)'
                : 'linear-gradient(90deg, #34d399, #10b981)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
