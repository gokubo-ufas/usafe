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
      {/* カラーブロック：全情報（全テキスト白太字） */}
      <div className={`px-4 pt-4 pb-4 font-bold text-white ${isDrill ? 'bg-amber-400' : 'bg-red-600'}`}>

        {/* 震度（左）＋ 回答数・発報情報（右） */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {event.max_intensity != null ? (
              <>
                <p className="text-xs tracking-[0.15em] uppercase mb-0.5">最大震度</p>
                <p className="font-black leading-none tracking-tighter"
                   style={{ fontSize: 'clamp(3rem, 15vw, 4.5rem)' }}>
                  {formatIntensity(event.max_intensity)}
                </p>
                {event.epicenter && (
                  <p className="text-xl mt-1.5">
                    <span className="text-xs mr-1">震源地：</span>
                    {event.epicenter}
                  </p>
                )}
              </>
            ) : !event.comment ? (
              <p className="text-lg">安否確認を行ってください</p>
            ) : null}
          </div>
          <div className="text-right shrink-0">
            <div className="mb-3">
              <span className="font-black text-2xl leading-none">{answeredCount}</span>
              <span className="text-sm"> / {totalCount}名</span>
              <p className="text-[10px] mt-0.5">回答済み</p>
            </div>
            <p className="text-[11px] tabular-nums leading-relaxed">
              {formatDateTimeFull(event.issued_at)}<br />
              発報（{event.issuer ?? '自動発報'}）
            </p>
          </div>
        </div>

        {/* 特記事項（常時表示） */}
        <p className="text-sm mb-4 leading-relaxed">
          <span className="text-xs tracking-[0.1em] uppercase mr-2">特記事項</span>
          {event.comment ?? '—'}
        </p>

        {/* 警告文（右下） */}
        <div className="flex justify-end mt-1">
          <p className="text-sm tracking-wide">
            ※ {isDrill ? 'これは避難訓練です' : 'これは訓練ではありません'}
          </p>
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
