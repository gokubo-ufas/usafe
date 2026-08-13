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
      {/* 緊急バナー */}
      <div className={`px-4 pt-4 pb-4 ${isDrill ? 'bg-amber-400' : 'bg-red-600'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-bold text-sm">
              {isDrill ? '🟡 避難訓練' : '🔴 安否確認'}
            </span>
            <span className="text-white/70 text-xs tabular-nums whitespace-nowrap">{formatDateTime(event.issued_at)}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-white font-black text-2xl tabular-nums leading-none">{answeredCount}</span>
            <span className="text-white/60 text-sm"> / {totalCount}名</span>
          </div>
        </div>

        <p className={`text-xs font-bold mt-1 ${isDrill ? 'text-amber-900/70' : 'text-white/80'}`}>
          {isDrill ? '⚠️ これは避難訓練です' : '🚨 これは訓練ではありません'}
        </p>

        {event.max_intensity != null ? (
          <div className="mt-3">
            <p className="text-white/80 text-xs font-semibold">最大震度</p>
            <p className="text-white font-black leading-none tracking-tighter mt-0.5"
               style={{ fontSize: 'clamp(3rem, 15vw, 4.5rem)' }}>
              {formatIntensity(event.max_intensity)}
            </p>
            {event.epicenter && (
              <p className="text-white text-base font-bold mt-1">{event.epicenter}</p>
            )}
          </div>
        ) : event.comment ? (
          <p className="text-white text-base font-bold mt-2 leading-snug">{event.comment}</p>
        ) : null}

        <p className="text-white/60 text-xs mt-2">発報者：{event.issuer ?? '自動'}</p>
      </div>

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
