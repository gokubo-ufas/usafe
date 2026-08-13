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
      {/* カラーブロック：全情報 */}
      <div className={`px-4 pt-4 pb-4 space-y-3 ${isDrill ? 'bg-amber-400' : 'bg-red-600'}`}>
        {/* 種別・日時・回答数・警告 */}
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className={`text-sm font-bold ${isDrill ? 'text-amber-950' : 'text-white'}`}>
                {isDrill ? '避難訓練発報' : '本番発報'}
              </span>
              <span className={`ml-2 text-xs tabular-nums ${isDrill ? 'text-amber-900/60' : 'text-white/60'}`}>
                {formatDateTime(event.issued_at)}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className={`font-black text-2xl tabular-nums leading-none ${isDrill ? 'text-amber-950' : 'text-white'}`}>{answeredCount}</span>
              <span className={`text-sm ${isDrill ? 'text-amber-900/60' : 'text-white/60'}`}> / {totalCount}名</span>
            </div>
          </div>
          <p className={`text-xs font-semibold mt-0.5 ${isDrill ? 'text-amber-900/70' : 'text-white/75'}`}>
            {isDrill ? 'これは避難訓練です' : 'これは訓練ではありません'}
          </p>
        </div>

        {/* 地震情報 */}
        {event.max_intensity != null && (
          <div>
            <p className={`text-[10px] font-semibold tracking-wide ${isDrill ? 'text-amber-900/60' : 'text-white/60'}`}>最大震度</p>
            <p className={`font-black leading-none tracking-tighter mt-0.5 ${isDrill ? 'text-amber-950' : 'text-white'}`}
               style={{ fontSize: 'clamp(3rem, 15vw, 4.5rem)' }}>
              {formatIntensity(event.max_intensity)}
            </p>
            {event.epicenter && (
              <p className={`text-base font-bold mt-1 ${isDrill ? 'text-amber-900' : 'text-white'}`}>{event.epicenter}</p>
            )}
          </div>
        )}

        {/* コメント */}
        {event.comment && (
          <p className={`text-sm leading-relaxed ${isDrill ? 'text-amber-900' : 'text-white'}`}>
            {event.comment}
          </p>
        )}

        {/* 発報者 */}
        <p className={`text-xs pt-1 border-t ${isDrill ? 'text-amber-900/50 border-amber-500/40' : 'text-white/50 border-white/20'}`}>
          発報者：{event.issuer ?? '自動'}
        </p>
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
