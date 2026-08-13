import type { Event } from '@/types'
import { formatDateTimeFull, formatIntensity, getDisplayEventType } from '@/lib/utils'

type Props = {
  event: Event
  answeredCount: number
  totalCount: number
}

export function EventColorBlock({ event, answeredCount, totalCount }: Props) {
  const isDrill = getDisplayEventType(event) === 'test'

  return (
    <div className={`px-4 pt-5 pb-4 text-white ${isDrill ? 'bg-amber-400' : 'bg-red-600'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          {event.max_intensity != null ? (
            <>
              <p className="text-3xl font-black tracking-tight leading-tight">
                最大震度 {formatIntensity(event.max_intensity)}
              </p>
              {event.epicenter && (
                <p className="text-base font-bold mt-1.5">
                  <span className="text-xs text-white/70 mr-1">震源地</span>
                  {event.epicenter}
                </p>
              )}
            </>
          ) : (
            <p className="text-lg font-bold">安否確認を行ってください</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black leading-none tabular-nums">
            {answeredCount}<span className="text-sm font-bold"> / {totalCount}名</span>
          </p>
          <p className="text-xs text-white/75 mt-0.5">回答済み</p>
        </div>
      </div>

      <div className="border-t border-white/20 mb-3" />

      <p className="text-sm font-bold mb-4">
        <span className="text-[10px] text-white/70 uppercase tracking-wider mr-2">特記事項</span>
        {event.comment ?? '—'}
      </p>

      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] text-white/70 tabular-nums leading-relaxed">
          {formatDateTimeFull(event.issued_at)}<br />
          発報（{event.issuer ?? '自動発報'}）
        </p>
        <p className="text-[11px] font-bold text-right shrink-0">
          ※ {isDrill ? 'これは避難訓練です' : 'これは訓練ではありません'}
        </p>
      </div>
    </div>
  )
}
