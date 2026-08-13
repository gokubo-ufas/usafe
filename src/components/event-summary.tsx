import type { Event } from '@/types'
import { formatDateTimeFull, formatIntensity, getDisplayEventType } from '@/lib/utils'

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
      <div className={`px-4 pt-4 pb-4 ${isDrill ? 'bg-amber-400' : 'bg-red-600'}`}>
        {/* 回答数（右上） */}
        <div className={`text-right text-xs mb-3 ${isDrill ? 'text-amber-900/65' : 'text-white/65'}`}>
          <span className={`font-black text-2xl leading-none ${isDrill ? 'text-amber-950' : 'text-white'}`}>{answeredCount}</span>
          {' '}/ {totalCount}名 回答済み
        </div>

        {/* 地震情報 */}
        {event.max_intensity != null && (
          <div className="mb-3">
            <p className={isDrill ? 'text-amber-950' : 'text-white'}>
              <span className={`text-xs ${isDrill ? 'text-amber-900/65' : 'text-white/65'}`}>最大震度：</span>
              <span className="text-4xl font-black">{formatIntensity(event.max_intensity)}</span>
            </p>
            {event.epicenter && (
              <p className={`text-base font-bold mt-0.5 ${isDrill ? 'text-amber-950' : 'text-white'}`}>
                <span className={`text-xs font-normal ${isDrill ? 'text-amber-900/65' : 'text-white/65'}`}>震源地：</span>
                {event.epicenter}
              </p>
            )}
          </div>
        )}

        {/* 特記事項 */}
        {event.comment && (
          <p className={`text-sm mb-3 ${isDrill ? 'text-amber-950' : 'text-white'}`}>
            <span className={`text-xs ${isDrill ? 'text-amber-900/65' : 'text-white/65'}`}>特記事項：</span>
            {event.comment}
          </p>
        )}

        {/* 発報者・発報日時 */}
        <p className={`text-xs mb-3 ${isDrill ? 'text-amber-900/65' : 'text-white/65'}`}>
          発報者：{event.issuer ?? '自動'}　発報日時：{formatDateTimeFull(event.issued_at)}
        </p>

        {/* ※ 警告（右下ボックス） */}
        <div className="flex justify-end">
          <span className={`text-xs font-semibold border px-2 py-1 ${isDrill ? 'text-amber-950 border-amber-600/50' : 'text-white border-white/40'}`}>
            ※ {isDrill ? 'これは避難訓練です' : 'これは訓練ではありません'}
          </span>
        </div>
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
