'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ConfirmModal } from '@/components/confirm-modal'
import { dispatchDrill, dispatchProduction, fetchAndSyncFromGAS } from './actions'
import { cn } from '@/lib/cn'
import type { SyncResult } from './actions'

type Mode = 'drill' | 'production'
type DispatchState = { error?: string; success?: string; slackFailed?: boolean }
const INIT: DispatchState = {}

export type Employee = {
  employee_number: string
  name: string
  department: string | null
  is_active: boolean
  updated_at: string
}

export function DispatchManager({
  employees,
  lastUpdatedAt,
}: {
  employees: Employee[]
  lastUpdatedAt: string | null
}) {
  const activeEmployees  = employees.filter(e => e.is_active)
  const retiredEmployees = employees.filter(e => !e.is_active)

  const [checked, setChecked] = useState<Set<string>>(
    new Set(activeEmployees.map(e => e.employee_number)),
  )
  const [modal, setModal] = useState<Mode | null>(null)

  const [drillState, drillAction, drillPending] = useActionState(dispatchDrill, INIT)
  const [prodState,  prodAction,  prodPending]  = useActionState(dispatchProduction, INIT)

  const isPending   = modal === 'drill' ? drillPending : prodPending
  const activeState = modal === 'drill' ? drillState   : prodState

  const router = useRouter()
  const [syncPending, startSync] = useTransition()
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  const prevActiveNums = useRef(new Set(activeEmployees.map(e => e.employee_number)))
  useEffect(() => {
    const currentNums = new Set(employees.filter(e => e.is_active).map(e => e.employee_number))
    const added = [...currentNums].filter(n => !prevActiveNums.current.has(n))
    if (added.length > 0) {
      setChecked(prev => {
        const next = new Set(prev)
        added.forEach(n => next.add(n))
        return next
      })
    }
    prevActiveNums.current = currentNums
  }, [employees])

  const allActiveChecked = activeEmployees.length > 0 && checked.size === activeEmployees.length

  function toggleAll() {
    setChecked(allActiveChecked ? new Set() : new Set(activeEmployees.map(e => e.employee_number)))
  }

  function toggleOne(num: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(num)) next.delete(num)
      else next.add(num)
      return next
    })
  }

  function handleDispatchConfirm({ comment, intensity, epicenter }: { comment: string; intensity: string; epicenter: string }) {
    setModal(null)
    const fd = new FormData()
    fd.set('comment', comment)
    fd.set('intensity', intensity)
    fd.set('epicenter', epicenter)
    fd.set('employee_numbers', JSON.stringify([...checked]))
    if (modal === 'drill') drillAction(fd)
    else                   prodAction(fd)
  }

  function fetchAndSync() {
    setSyncResult(null)
    startSync(async () => {
      const result = await fetchAndSyncFromGAS()
      setSyncResult(result)
      if (result.ok) router.refresh()
    })
  }

  const successState = drillState.success ? drillState : prodState.success ? prodState : null
  if (successState?.success) {
    return (
      <div className="px-4 pt-8 space-y-4">
        <div className={cn(
          'border p-5 space-y-4',
          successState.slackFailed ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300',
        )}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{successState.slackFailed ? '⚠️' : '✅'}</span>
            <p className={cn('text-sm font-medium leading-relaxed', successState.slackFailed ? 'text-amber-800' : 'text-emerald-800')}>
              {successState.success}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="block w-full py-3 text-center text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ダッシュボードへ戻る
          </Link>
        </div>
      </div>
    )
  }

  // 部署でグループ化
  const deptMap = new Map<string, Employee[]>()
  for (const emp of activeEmployees) {
    const dept = emp.department ?? '部署未設定'
    if (!deptMap.has(dept)) deptMap.set(dept, [])
    deptMap.get(dept)!.push(emp)
  }

  const lastSyncLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div>
      {/* 発報ボタン */}
      <div className="grid grid-cols-2 gap-px bg-gray-200 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setModal('drill')}
          disabled={checked.size === 0}
          className="flex flex-col items-center justify-center gap-1.5 py-6 bg-amber-400 hover:bg-amber-500 text-amber-950 transition-colors disabled:opacity-40"
        >
          <span className="text-xl leading-none">🟡</span>
          <span className="text-sm font-bold">訓練発報</span>
          <span className="text-[10px] text-amber-800/70">{checked.size}名に送信</span>
        </button>
        <button
          type="button"
          onClick={() => setModal('production')}
          disabled={checked.size === 0}
          className="flex flex-col items-center justify-center gap-1.5 py-6 bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-40"
        >
          <span className="text-xl leading-none">🔴</span>
          <span className="text-sm font-bold">本番発報</span>
          <span className="text-[10px] text-white/60">{checked.size}名に送信</span>
        </button>
      </div>

      {/* 対象者ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-white">
        <span className="text-xs font-bold text-gray-500">
          発報対象
          <span className="text-emerald-600 tabular-nums ml-1.5">{checked.size}</span>
          <span className="text-gray-400 font-normal"> / {activeEmployees.length}名</span>
        </span>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          {allActiveChecked ? '全解除' : '全選択'}
        </button>
      </div>

      {/* 社員リスト（部署ごと） */}
      <div className="bg-white">
        {[...deptMap.entries()].map(([dept, emps]) => (
          <div key={dept}>
            <div className="px-4 py-1.5 bg-gray-50 border-y border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 tracking-wide">{dept}</span>
            </div>
            {emps.map(emp => (
              <label
                key={emp.employee_number}
                className="flex items-center gap-3.5 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50/80 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked.has(emp.employee_number)}
                  onChange={() => toggleOne(emp.employee_number)}
                  className="w-4 h-4 accent-emerald-600 shrink-0"
                />
                <span className="text-sm font-medium text-gray-800">{emp.name}</span>
              </label>
            ))}
          </div>
        ))}

        {retiredEmployees.length > 0 && (
          <div>
            <div className="px-4 py-1.5 bg-gray-50 border-y border-gray-100">
              <span className="text-[10px] font-semibold text-gray-300 tracking-wide">退職済み（対象外）</span>
            </div>
            {retiredEmployees.map(emp => (
              <div
                key={emp.employee_number}
                className="flex items-center gap-3.5 px-4 py-3 border-b border-gray-100 opacity-35"
              >
                <span className="w-4 h-4 shrink-0" />
                <span className="text-sm text-gray-500 line-through">{emp.name}</span>
                {emp.department && (
                  <span className="text-[10px] text-gray-400 ml-auto">{emp.department}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 社員情報同期（セカンダリ） */}
      <div className="px-4 pt-4 pb-8 space-y-2">
        <button
          type="button"
          onClick={fetchAndSync}
          disabled={syncPending}
          className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <span className="text-xs font-medium text-gray-500">
            {syncPending ? '取得中…' : '社員情報をスプレッドシートから更新'}
          </span>
          <span className="text-[10px] text-gray-400 shrink-0 ml-3">
            {lastSyncLabel ? `最終 ${lastSyncLabel}` : '未取得'}
          </span>
        </button>
        {syncResult?.ok && (
          <p className="text-xs text-center text-emerald-600">更新が完了しました。</p>
        )}
        {syncResult && !syncResult.ok && (
          <div className="border border-amber-200 bg-amber-50 px-4 py-3 space-y-0.5">
            <p className="text-xs font-semibold text-amber-800">スプレッドシートとの同期に失敗しました</p>
            <p className="text-xs text-amber-700">現在のデータで発報できますが、内容を確認してから発報してください。</p>
          </div>
        )}
      </div>

      {modal && (
        <DispatchModal
          mode={modal}
          employeeCount={checked.size}
          isPending={isPending}
          error={activeState.error}
          onClose={() => setModal(null)}
          onConfirm={handleDispatchConfirm}
        />
      )}
    </div>
  )
}

const INTENSITY_OPTIONS = [
  { value: '',   label: '—（未設定）' },
  { value: '10', label: '震度1' },
  { value: '20', label: '震度2' },
  { value: '30', label: '震度3' },
  { value: '40', label: '震度4' },
  { value: '45', label: '震度5弱' },
  { value: '50', label: '震度5強' },
  { value: '55', label: '震度6弱' },
  { value: '60', label: '震度6強' },
  { value: '70', label: '震度7' },
]

function DispatchModal({
  mode, employeeCount, isPending, error, onClose, onConfirm,
}: {
  mode: Mode
  employeeCount: number
  isPending: boolean
  error?: string
  onClose: () => void
  onConfirm: (data: { comment: string; intensity: string; epicenter: string }) => void
}) {
  const isDrill = mode === 'drill'

  const [comment,     setComment]     = useState('')
  const [intensity,   setIntensity]   = useState(isDrill ? '40' : '')
  const [epicenter,   setEpicenter]   = useState(isDrill ? '訓練用（仮）' : '')
  const [agreed,      setAgreed]      = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const canSubmit = isDrill || agreed

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="bg-white shadow-2xl w-full sm:max-w-xs max-h-[88vh] flex flex-col">
          {/* モーダルヘッダー */}
          <div className={cn(
            'px-5 pt-4 pb-3 border-b border-white/20 shrink-0',
            isDrill ? 'bg-amber-400' : 'bg-red-500',
          )}>
            <div className="flex items-center justify-between">
              <h2 className={cn('text-base font-bold', isDrill ? 'text-amber-950' : 'text-white')}>
                {isDrill ? '避難訓練発報' : '本番発報'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className={cn('w-8 h-8 flex items-center justify-center', isDrill ? 'text-amber-800 hover:text-amber-950' : 'text-white/70 hover:text-white')}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className={cn('text-xs mt-0.5', isDrill ? 'text-amber-800' : 'text-white/70')}>
              {employeeCount}名に安否確認を送信します
            </p>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            {!isDrill && (
              <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-2">
                🚨 これは訓練ではありません
              </p>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                最大震度 <span className="font-normal text-gray-400 text-xs">任意</span>
              </label>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                className={cn(
                  'w-full text-sm text-gray-900 bg-gray-50 border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent',
                  isDrill ? 'focus:ring-amber-400' : 'focus:ring-red-400',
                )}
              >
                {INTENSITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                震源地 <span className="font-normal text-gray-400 text-xs">任意</span>
              </label>
              <input
                type="text"
                value={epicenter}
                onChange={(e) => setEpicenter(e.target.value)}
                placeholder="例：神奈川県西部"
                className={cn(
                  'w-full text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent',
                  isDrill ? 'focus:ring-amber-400' : 'focus:ring-red-400',
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                特記事項 <span className="font-normal text-gray-400 text-xs">任意・50文字以内</span>
              </label>
              <textarea
                rows={2}
                maxLength={50}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={isDrill ? '訓練の目的・注意事項' : '緊急対応指示など'}
                className={cn(
                  'w-full text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent resize-none',
                  isDrill ? 'focus:ring-amber-400' : 'focus:ring-red-400',
                )}
              />
            </div>

            {!isDrill && (
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-red-600 shrink-0"
                />
                <span className="text-xs text-gray-600 leading-snug">
                  ダッシュボードで自動発報されていないことを確認しました。本番発報に同意します。
                </span>
              </label>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2.5">{error}</p>
            )}

            <div className="flex gap-2 pb-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={isPending || !canSubmit}
                className={cn(
                  'flex-1 py-2.5 text-sm font-bold disabled:opacity-40 transition-colors',
                  isDrill
                    ? 'bg-amber-400 hover:bg-amber-500 text-amber-950'
                    : 'bg-red-500 hover:bg-red-600 text-white',
                )}
              >
                {isPending ? '発報中…' : '発報する'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title={isDrill ? '避難訓練の確認' : '本番発報の確認'}
        message={isDrill
          ? `選択した${employeeCount}名に避難訓練の安否確認を発報します。\nよろしいですか？`
          : `選択した${employeeCount}名に安否確認を発報します。\nこの操作は取り消せません。よろしいですか？`}
        confirmLabel="発報する"
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => { setShowConfirm(false); onConfirm({ comment, intensity, epicenter }) }}
        isPending={isPending}
        danger={!isDrill}
        warning={isDrill}
      />
    </>
  )
}
