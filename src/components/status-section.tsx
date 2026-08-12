'use client'

import { useState, type ReactNode } from 'react'
import type { EmployeeWithStatus, Response } from '@/types'
import { STATUS_GROUP_CONFIG } from '@/lib/utils'
import { cn } from '@/lib/cn'

const GROUP_ORDER = ['critical', 'checking', 'unanswered', 'safe'] as const

const SELF_LABEL: Record<string, string> = {
  safe:        '無事',
  injured:     '負傷',
  need_rescue: '救助要請',
}

const FAMILY_LABEL: Record<string, string> = {
  safe:           '無事',
  injured:        '負傷',
  need_rescue:    '救助要請',
  checking:       '確認中',
  not_applicable: '対象外',
}

const WORK_LABEL: Record<string, string> = {
  available:   '可能',
  unavailable: '困難',
}

const SUMMARY_CONFIG = {
  critical: {
    label: '負傷',
    fg: 'text-red-600',
    gradFrom: 'from-red-50',
    border: 'border-red-200',
    accentBorder: 'border-l-red-400',
    headerBg: 'bg-red-50/60',
    badgeClass: 'bg-red-100 text-red-600',
    dot: 'bg-red-400',
  },
  checking: {
    label: '安否確認中',
    fg: 'text-amber-600',
    gradFrom: 'from-amber-50',
    border: 'border-amber-200',
    accentBorder: 'border-l-amber-400',
    headerBg: 'bg-amber-50/60',
    badgeClass: 'bg-amber-100 text-amber-600',
    dot: 'bg-amber-400',
  },
  unanswered: {
    label: '未回答',
    fg: 'text-gray-400',
    gradFrom: 'from-gray-50',
    border: 'border-gray-200',
    accentBorder: 'border-l-gray-300',
    headerBg: 'bg-gray-50/60',
    badgeClass: 'bg-gray-100 text-gray-500',
    dot: 'bg-gray-300',
  },
  safe: {
    label: '無事',
    fg: 'text-emerald-600',
    gradFrom: 'from-emerald-50',
    border: 'border-emerald-200',
    accentBorder: 'border-l-emerald-400',
    headerBg: 'bg-emerald-50/60',
    badgeClass: 'bg-emerald-100 text-emerald-600',
    dot: 'bg-emerald-400',
  },
} as const

function formatAnsweredAt(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  return sameDay
    ? d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─────────────────────────────────────────
// EmployeeGrid
// ─────────────────────────────────────────

function StatusCell({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs whitespace-nowrap">
      <span className="text-gray-400">{label}：</span>
      <span className="font-semibold text-gray-700">{value}</span>
    </span>
  )
}

function EmployeeGrid({ members }: { members: EmployeeWithStatus[] }) {
  return (
    <div className="divide-y divide-gray-100/80">
      {members.map((emp) => {
        const r: Response | null = emp.latestResponse
        const answered = r && r.self_status !== null

        const selfVal   = r?.self_status   ? (SELF_LABEL[r.self_status]     ?? r.self_status)   : '—'
        const familyVal = r?.family_status ? (FAMILY_LABEL[r.family_status] ?? r.family_status) : '—'
        const workVal   = r?.work_status   ? (WORK_LABEL[r.work_status]     ?? r.work_status)   : '—'

        return (
          <div
            key={emp.employee_number}
            className={cn(
              'grid items-center py-3',
              'grid-cols-[auto_1fr_auto_auto_auto_auto]',
              'sm:grid-cols-[auto_1fr_auto_auto_auto_1fr_auto]',
            )}
          >
            {/* 部署 */}
            <div className="pl-4 pr-3 flex items-center">
              {emp.department && (
                <span className="text-[10px] font-medium text-gray-400 bg-gray-100 rounded-md px-1.5 py-0.5 whitespace-nowrap tracking-wide">
                  {emp.department}
                </span>
              )}
            </div>

            {/* 名前 */}
            <div className="pr-4 flex items-center">
              <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{emp.name}</span>
            </div>

            {/* 本人 */}
            <div className="pr-4 flex items-center">
              {answered ? <StatusCell label="本人" value={selfVal} /> : null}
            </div>

            {/* 家族 */}
            <div className="pr-4 flex items-center">
              {answered ? <StatusCell label="家族" value={familyVal} /> : null}
            </div>

            {/* 業務 */}
            <div className="pr-4 flex items-center">
              {answered ? <StatusCell label="業務" value={workVal} /> : null}
            </div>

            {/* コメント (sm+) */}
            <div className="pr-4 min-w-0 hidden sm:flex items-center">
              {answered && r?.comment && (
                <span className="text-xs text-gray-400 truncate block" title={r.comment}>
                  「{r.comment}」
                </span>
              )}
            </div>

            {/* 時刻 */}
            <div className="pr-4 flex items-center justify-end">
              {answered && r && (
                <span className="text-[10px] text-gray-300 whitespace-nowrap tabular-nums">
                  {formatAnsweredAt(r.created_at)}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────
// StatusSection
// ─────────────────────────────────────────

export function StatusSection({ employees, middleSlot }: { employees: EmployeeWithStatus[]; middleSlot?: ReactNode }) {
  const [dept, setDept] = useState('')
  const [groupFilter, setGroupFilter] = useState<typeof GROUP_ORDER[number] | ''>('')

  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean))
  ).sort() as string[]

  const deptFiltered = dept ? employees.filter((e) => e.department === dept) : employees

  const groups = GROUP_ORDER.map((key) => ({
    key,
    config: STATUS_GROUP_CONFIG[key],
    summary: SUMMARY_CONFIG[key],
    members: deptFiltered.filter((e) => e.statusGroup === key),
    total:   employees.filter((e) => e.statusGroup === key).length,
  }))

  const visibleGroups = groups.filter(
    (g) => g.members.length > 0 && (groupFilter === '' || g.key === groupFilter)
  )

  return (
    <div className="space-y-4">

      {middleSlot}

      {/* サマリーカード */}
      <div className="grid grid-cols-4 gap-1.5">
        {groups.map(({ key, summary, total }) => {
          const isActive = groupFilter === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setGroupFilter(isActive ? '' : key)}
              disabled={total === 0}
              className={cn(
                'rounded-xl border bg-gradient-to-br to-white px-2 py-3 text-center transition-all duration-200',
                summary.gradFrom,
                isActive
                  ? cn('border-2', summary.border, 'shadow-lg scale-[1.03]')
                  : 'border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01]',
                total === 0 && 'opacity-25 cursor-default pointer-events-none',
              )}
            >
              <div className={cn('text-2xl font-bold tabular-nums tracking-tight', summary.fg)}>
                {total}
              </div>
              <div className={cn('text-[10px] font-semibold mt-0.5 leading-tight', summary.fg)}>
                {summary.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* 部署フィルター */}
      {departments.length > 1 && (
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent shadow-sm"
        >
          <option value="">全部署</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      )}

      {/* グループ一覧 */}
      {visibleGroups.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">該当する社員がいません</p>
      ) : (
        <div className="space-y-3">
          {visibleGroups.map(({ key, config, summary, members }) => (
            <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* グループヘッダー */}
              <div className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 border-l-4',
                summary.headerBg,
                summary.accentBorder,
              )}>
                <h3 className={cn('text-sm font-bold flex-1 tracking-tight', summary.fg)}>
                  {config.label}
                </h3>
                <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-semibold', summary.badgeClass)}>
                  {members.length}名
                </span>
              </div>

              <EmployeeGrid members={members} />
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
