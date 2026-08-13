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

  function handleDispatchConfirm(comment: string) {
    setModal(null)
    const fd = new FormData()
    fd.set('comment', comment)
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
      <div className={cn(
        'rounded-2xl border p-6 space-y-4',
        successState.slackFailed
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-emerald-500/10 border-emerald-500/30',
      )}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{successState.slackFailed ? '⚠️' : '✅'}</span>
          <p className={cn('text-sm font-medium leading-relaxed', successState.slackFailed ? 'text-amber-300' : 'text-emerald-300')}>
            {successState.success}
          </p>
        </div>
        <Link href="/dashboard" className="block w-full py-3 text-center text-sm font-semibold rounded-xl bg-white/[0.08] border border-white/10 text-white/70 hover:bg-white/[0.12] transition-colors">
          ダッシュボードへ戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── 発報 ── */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setModal('drill')}
          disabled={checked.size === 0}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl transition-colors disabled:opacity-40"
        >
          🟡 訓練発報
        </button>
        <button
          type="button"
          onClick={() => setModal('production')}
          disabled={checked.size === 0}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold bg-red-500 hover:bg-red-400 text-white rounded-xl transition-colors disabled:opacity-40"
        >
          🔴 本番発報
        </button>
      </div>

      {/* ── 社員情報取得 ── */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider">社員情報取得</h2>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={fetchAndSync}
            disabled={syncPending}
            className="w-full flex flex-col items-center justify-center gap-0.5 py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors disabled:opacity-40"
          >
            <span className="text-sm font-semibold text-emerald-400">
              {syncPending ? '取得中…' : '社員SpreadSheetを取得し最新化'}
            </span>
            <span className="text-[11px] text-emerald-500/60">
              {lastUpdatedAt
                ? `最終取得：${new Date(lastUpdatedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                : '未取得'}
            </span>
          </button>
          {syncResult?.ok && (
            <p className="text-xs text-center text-emerald-400">
              最新化が完了しました。
            </p>
          )}
          {syncResult && !syncResult.ok && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 space-y-0.5">
              <p className="text-xs font-semibold text-amber-300">スプレッドシートとの同期に失敗しました</p>
              <p className="text-xs text-amber-400/70">現在アプリに登録されている社員情報で発報できますが、発報先の内容を確認してから発報してください。</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 対象選択 ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider">対象選択</h2>
          <span className="text-[11px] text-white/25">合計 {employees.length}名（在籍中 {activeEmployees.length}名 / 退職済 {retiredEmployees.length}名）</span>
        </div>
        <div className="flex items-center justify-between px-0.5">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {allActiveChecked ? '全員の選択を解除' : '全員にチェック'}
          </button>
          <span className="text-sm text-white/50">{checked.size}名を選択中</span>
        </div>
        <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/[0.08] overflow-hidden">

          <div className="grid grid-cols-[1rem_1fr_1fr_4rem] gap-x-3 px-4 py-1.5 border-b border-white/[0.06] bg-white/[0.03] text-[10px] font-semibold text-white/25 uppercase tracking-wide items-center">
            <input
              type="checkbox"
              checked={allActiveChecked}
              onChange={toggleAll}
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
            <span>部署名</span>
            <span>氏名</span>
            <span>在籍状況</span>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {employees.map(emp => emp.is_active ? (
              <label
                key={emp.employee_number}
                className="grid grid-cols-[1rem_1fr_1fr_4rem] gap-x-3 px-4 py-1.5 text-xs cursor-pointer hover:bg-white/[0.04] transition-colors items-center"
              >
                <input
                  type="checkbox"
                  checked={checked.has(emp.employee_number)}
                  onChange={() => toggleOne(emp.employee_number)}
                  className="w-4 h-4 accent-emerald-500"
                />
                <span className="text-white/60 truncate">{emp.department ?? '—'}</span>
                <span className="font-medium text-white/80 truncate">{emp.name}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 whitespace-nowrap text-center">
                  在籍中
                </span>
              </label>
            ) : (
              <div
                key={emp.employee_number}
                className="grid grid-cols-[1rem_1fr_1fr_4rem] gap-x-3 px-4 py-1.5 text-xs bg-white/[0.02] items-center"
              >
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-white/30 text-[10px] font-bold leading-none">
                  ✕
                </span>
                <span className="text-white/30 truncate">{emp.department ?? '—'}</span>
                <span className="font-medium text-white/30 truncate">{emp.name}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30 whitespace-nowrap text-center">
                  退職済
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* 発報モーダル */}
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

function DispatchModal({
  mode, employeeCount, isPending, error, onClose, onConfirm,
}: {
  mode: Mode
  employeeCount: number
  isPending: boolean
  error?: string
  onClose: () => void
  onConfirm: (comment: string) => void
}) {
  const [comment,     setComment]     = useState('')
  const [agreed,      setAgreed]      = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isDrill   = mode === 'drill'
  const canSubmit = isDrill || agreed

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <div className="bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xs max-h-[88vh] flex flex-col">

          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.08] shrink-0">
            <h2 className="text-base font-bold text-white">{isDrill ? '🟡 避難訓練発報' : '🔴 本番発報'}</h2>
            <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/70 hover:bg-white/10">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            <p className="text-sm text-white/60">
              選択した <span className="font-bold text-white">{employeeCount}名</span> に{isDrill ? '避難訓練の' : ''}安否確認を発報します。
            </p>

            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                コメント <span className="font-normal text-white/30 normal-case tracking-normal">（任意・50文字以内）</span>
              </label>
              <textarea
                rows={3} maxLength={50} value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder={isDrill ? '訓練の目的や注意事項を入力してください' : '緊急事態の状況や対応指示を入力してください'}
                className={cn('w-full text-sm text-white/80 placeholder:text-white/20 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:border-transparent resize-none', isDrill ? 'focus:ring-amber-400/50 focus:border-amber-400/30' : 'focus:ring-red-500/50 focus:border-red-500/30')}
              />
            </div>

            {!isDrill && (
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-red-500 shrink-0" />
                <span className="text-sm text-white/60 leading-snug">ホームと履歴で自動発報がされていないことを確認しました。本番発報することに同意します。</span>
              </label>
            )}

            {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">{error}</p>}

            <div className="flex gap-3 pb-1">
              <button type="button" onClick={onClose} disabled={isPending} className="flex-1 py-2.5 text-sm font-medium text-white/50 bg-white/[0.06] rounded-xl hover:bg-white/10 disabled:opacity-50">キャンセル</button>
              <button type="button" onClick={() => setShowConfirm(true)} disabled={isPending || !canSubmit} className={cn('flex-1 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors', isDrill ? 'bg-amber-400 hover:bg-amber-300 text-amber-950' : 'bg-red-500 hover:bg-red-400 text-white')}>
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
        onConfirm={() => { setShowConfirm(false); onConfirm(comment) }}
        isPending={isPending}
        danger={!isDrill}
        warning={isDrill}
      />
    </>
  )
}
