'use client'

import { useState, type ReactNode } from 'react'
import type { EmployeeWithStatus, Response } from '@/types'
import { STATUS_GROUP_CONFIG } from '@/lib/utils'
import { cn } from '@/lib/cn'

const GROUP_ORDER = ['critical', 'checking', 'unanswered', 'safe'] as const

const SELF_LABEL: Record<string, string> = {
  safe:        '無事',
  injured:     '負傷',
  need_rescue: '救助が必要',
}

const FAMILY_LABEL: Record<string, string> = {
  safe:           '無事',
  injured:        '負傷',
  need_rescue:    '救助が必要',
  checking:       '安否確認中',
  not_applicable: '対象家族なし',
}

const WORK_LABEL: Record<string, string> = {
  available:   '対応可能',
  unavailable: '対応困難',
}

const SUMMARY_CONFIG = {
  critical: {
    label: '要対応',
    description: '負傷・救助要請あり',
    fg: 'text-red-400',
    border: 'border-red-500/40',
    accentBorder: 'border-l-red-500',
    headerBg: 'bg-red-500/10',
    badgeClass: 'bg-red-500/20 text-red-300',
    cardBg: 'bg-red-500/5',
    activeBorder: 'border-red-500/50',
  },
  checking: {
    label: '確認中',
    description: '家族の安否を確認中',
    fg: 'text-amber-400',
    border: 'border-amber-500/40',
    accentBorder: 'border-l-amber-400',
    headerBg: 'bg-amber-500/10',
    badgeClass: 'bg-amber-500/20 text-amber-300',
    cardBg: 'bg-amber-500/5',
    activeBorder: 'border-amber-500/50',
  },
  unanswered: {
    label: '未回答',
    description: 'まだ回答がない',
    fg: 'text-white/50',
    border: 'border-white/15',
    accentBorder: 'border-l-white/25',
    headerBg: 'bg-white/5',
    badgeClass: 'bg-white/10 text-white/60',
    cardBg: 'bg-white/[0.03]',
    activeBorder: 'border-white/25',
  },
  safe: {
    label: '無事',
    description: '本人・家族ともに安全',
    fg: 'text-emerald-400',
    border: 'border-emerald-500/40',
    accentBorder: 'border-l-emerald-500',
    headerBg: 'bg-emerald-500/10',
    badgeClass: 'bg-emerald-500/20 text-emerald-300',
    cardBg: 'bg-emerald-500/5',
    activeBorder: 'border-emerald-500/50',
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

function EmployeeGrid({ members }: { members: EmployeeWithStatus[] }) {
  return (
    <div className="divide-y divide-white/[0.06]">
      {members.map((emp) => {
        const r: Response | null = emp.latestResponse
        const answered = r && r.self_status !== null

        const selfVal   = r?.self_status   ? (SELF_LABEL[r.self_status]     ?? r.self_status)   : '—'
        const familyVal = r?.family_status ? (FAMILY_LABEL[r.family_status] ?? r.family_status) : '—'
        const workVal   = r?.work_status   ? (WORK_LABEL[r.work_status]     ?? r.work_status)   : '—'

        return (
          <div key={emp.employee_number} className="px-4 py-2.5 space-y-1">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="text-sm font-semibold text-white/80 truncate min-w-0">{emp.name}</span>
              <span className="text-[10px] text-white/25 whitespace-nowrap tabular-nums shrink-0">
                {answered && r ? formatAnsweredAt(r.created_at) : ''}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-x-1 text-[11px]">
              <span>
                <span className="text-white/30">本人：</span>
                <span className="font-semibold text-white/70">{selfVal}</span>
              </span>
              <span>
                <span className="text-white/30">家族：</span>
                <span className="font-semibold text-white/70">{familyVal}</span>
              </span>
              <span>
                <span className="text-white/30">業務：</span>
                <span className="font-semibold text-white/70">{workVal}</span>
              </span>
            </div>

            {r?.comment && (
              <div className="text-xs text-white/30">
                コメント：{r.comment}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {groups.map(({ key, summary, total }) => {
          const isActive = groupFilter === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setGroupFilter(isActive ? '' : key)}
              disabled={total === 0}
              className={cn(
                'rounded-xl border px-2 py-3 text-center transition-all duration-200',
                isActive
                  ? cn('border-2', summary.activeBorder, summary.cardBg, 'scale-[1.03]')
                  : cn('border', summary.border, 'bg-white/[0.04] hover:bg-white/[0.07] hover:scale-[1.01]'),
                total === 0 && 'opacity-25 cursor-default pointer-events-none',
              )}
            >
              <div className={cn('text-[11px] font-bold leading-tight', summary.fg)}>
                {summary.label}
              </div>
              <div className={cn('text-2xl font-bold tabular-nums tracking-tight mt-0.5', summary.fg)}>
                {total}
              </div>
              <div className="text-[9px] text-white/25 mt-0.5 leading-tight">
                {summary.description}
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
          className="w-full text-sm text-white/70 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30"
        >
          <option value="">全部署</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      )}

      {/* グループ一覧 */}
      {visibleGroups.length === 0 ? (
        <p className="text-sm text-white/30 text-center py-8">該当する社員がいません</p>
      ) : (
        <div className="space-y-3">
          {visibleGroups.map(({ key, config, summary, members }) => (
            <div key={key} className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/[0.08] overflow-hidden">

              <div className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 border-l-4',
                summary.headerBg,
                summary.accentBorder,
              )}>
                <h3 className={cn('text-sm font-bold tracking-tight shrink-0', summary.fg)}>
                  {config.label}
                </h3>
                <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0', summary.badgeClass)}>
                  {members.length}名
                </span>
                <p className="text-[10px] text-white/25 truncate flex-1 text-right">{summary.description}</p>
              </div>

              <EmployeeGrid members={members} />
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
