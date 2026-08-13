'use client'

import { useActionState, useState, useTransition } from 'react'
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
        successState.slackFailed ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300',
      )}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{successState.slackFailed ? '⚠️' : '✅'}</span>
          <p className={cn('text-sm font-medium leading-relaxed', successState.slackFailed ? 'text-amber-800' : 'text-emerald-800')}>
            {successState.success}
          </p>
        </div>
        <Link href="/dashboard" className="block w-full py-3 text-center text-sm font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
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
          className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold bg-amber-400 hover:bg-amber-500 text-amber-900 rounded-xl transition-colors disabled:opacity-40"
        >
          🟡 訓練発報
        </button>
        <button
          type="button"
          onClick={() => setModal('production')}
          disabled={checked.size === 0}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-40"
        >
          🔴 本番発報
        </button>
      </div>

      {/* ── 社員情報取得 ── */}
      <div className="space-y-2">
        <h2 className="text-base font-bold text-gray-900">社員情報取得</h2>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-0.5">
            <span>
              {lastUpdatedAt
                ? `最終取得：${new Date(lastUpdatedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                : '未取得'}
            </span>
            <span>合計 {employees.length}名（在籍中 {activeEmployees.length}名 / 退職済 {retiredEmployees.length}名）</span>
          </div>
          <div className="flex items-center gap-3 px-0.5">
            <button
              type="button"
              onClick={fetchAndSync}
              disabled={syncPending}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline transition-colors disabled:opacity-40"
            >
              {syncPending ? '取得中…' : '社員情報を取得し最新化'}
            </button>
            {syncResult && (
              syncResult.ok
                ? <span className="text-xs text-emerald-600">✓ {syncResult.received}名を登録（在籍中 {syncResult.active}名）</span>
                : <span className="text-xs text-red-500">{syncResult.error}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── 対象選択 ── */}
      <div className="space-y-2">
        <h2 className="text-base font-bold text-gray-900">対象選択</h2>
        <div className="flex items-center justify-between px-0.5">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            {allActiveChecked ? '全員の選択を解除' : '全員にチェック'}
          </button>
          <span className="text-sm text-gray-500">{checked.size}名を選択中</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* テーブルヘッダー */}
          <div className="grid grid-cols-[1rem_1fr_1fr_4rem] gap-x-3 px-4 py-1.5 border-b border-gray-100 bg-gray-50/40 text-[10px] font-semibold text-gray-400 uppercase tracking-wide items-center">
            <input
              type="checkbox"
              checked={allActiveChecked}
              onChange={toggleAll}
              className="w-4 h-4 accent-emerald-600 cursor-pointer"
            />
            <span>部署名</span>
            <span>氏名</span>
            <span>在籍状況</span>
          </div>

          {/* 全社員 */}
          <div className="divide-y divide-gray-100/80">
            {employees.map(emp => emp.is_active ? (
              <label
                key={emp.employee_number}
                className="grid grid-cols-[1rem_1fr_1fr_4rem] gap-x-3 px-4 py-1.5 text-xs cursor-pointer hover:bg-gray-50/60 transition-colors items-center"
              >
                <input
                  type="checkbox"
                  checked={checked.has(emp.employee_number)}
                  onChange={() => toggleOne(emp.employee_number)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <span className="text-gray-800 truncate">{emp.department ?? '—'}</span>
                <span className="font-medium text-gray-800 truncate">{emp.name}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap text-center">
                  在籍中
                </span>
              </label>
            ) : (
              <div
                key={emp.employee_number}
                className="grid grid-cols-[1rem_1fr_1fr_4rem] gap-x-3 px-4 py-1.5 text-xs bg-gray-50 items-center"
              >
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-400 text-[10px] font-bold leading-none">
                  ✕
                </span>
                <span className="text-gray-800 truncate">{emp.department ?? '—'}</span>
                <span className="font-medium text-gray-800 truncate">{emp.name}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap text-center">
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
          employeeCount={activeEmployees.length}
          isPending={isPending}
          error={activeState.error}
          onClose={() => setModal(null)}
          onConfirm={handleDispatchConfirm}
        />
      )}
    </div>
  )
}

// ── 発報モーダル ─────────────────────────────────

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[92vh] flex flex-col">

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">{isDrill ? '🟡 避難訓練発報' : '🔴 本番発報'}</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            在籍中の社員 <span className="font-bold text-gray-900">{employeeCount}名</span> 全員に{isDrill ? '避難訓練の' : ''}安否確認を発報します。
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              コメント <span className="font-normal text-gray-400">（任意・50文字以内）</span>
            </label>
            <textarea
              rows={3} maxLength={50} value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder={isDrill ? '訓練の目的や注意事項を入力してください' : '緊急事態の状況や対応指示を入力してください'}
              className={cn('w-full text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent resize-none', isDrill ? 'focus:ring-amber-400' : 'focus:ring-red-400')}
            />
          </div>

          {!isDrill && (
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-red-600 shrink-0" />
              <span className="text-sm text-gray-700 leading-snug">ホームと履歴で自動発報がされていないことを確認しました。本番発報することに同意します。</span>
            </label>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

          <div className="flex gap-3 pb-1">
            <button type="button" onClick={onClose} disabled={isPending} className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50">キャンセル</button>
            <button type="button" onClick={() => setShowConfirm(true)} disabled={isPending || !canSubmit} className={cn('flex-1 py-3 text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors', isDrill ? 'bg-amber-400 hover:bg-amber-500 text-amber-900' : 'bg-red-600 hover:bg-red-700 text-white')}>
              {isPending ? '発報中…' : '発報する'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title={isDrill ? '避難訓練の確認' : '本番発報の確認'}
        message={isDrill
          ? `全社員（${employeeCount}名）に避難訓練の安否確認を発報します。\nよろしいですか？`
          : `全社員（${employeeCount}名）に安否確認を発報します。\nこの操作は取り消せません。よろしいですか？`}
        confirmLabel="発報する"
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => { setShowConfirm(false); onConfirm(comment) }}
        isPending={isPending}
        danger={!isDrill}
        warning={isDrill}
      />
    </div>
  )
}
