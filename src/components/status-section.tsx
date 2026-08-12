import type { EmployeeWithStatus } from '@/types'
import { STATUS_GROUP_CONFIG, SELF_STATUS_LABELS, FAMILY_STATUS_LABELS, WORK_STATUS_LABELS } from '@/lib/utils'
import { cn } from '@/lib/cn'

const GROUP_ORDER = ['critical', 'checking', 'unanswered', 'safe'] as const

type Props = {
  employees: EmployeeWithStatus[]
}

export function StatusSection({ employees }: Props) {
  const groups = GROUP_ORDER.map((key) => ({
    key,
    config: STATUS_GROUP_CONFIG[key],
    members: employees.filter((e) => e.statusGroup === key),
  })).filter((g) => g.members.length > 0)

  if (groups.length === 0) return null

  return (
    <div className="space-y-4">
      {groups.map(({ key, config, members }) => (
        <div
          key={key}
          className={cn('rounded-xl border p-4', config.bgColor, config.borderColor)}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('w-2 h-2 rounded-full shrink-0', config.dotClass)} />
            <h3 className={cn('font-semibold text-sm', config.textColor)}>{config.label}</h3>
            <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full', config.badgeClass)}>
              {members.length}名
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3 ml-4">{config.description}</p>

          <div className="space-y-2">
            {members.map((emp) => (
              <div key={emp.employee_number} className="bg-white rounded-lg p-3 text-sm">
                {emp.latestResponse && emp.latestResponse.self_status !== null ? (
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
                    <span className="font-medium text-gray-900 min-w-0">{emp.name}</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                      {emp.latestResponse.self_status && (
                        <span>
                          本人：
                          <span className="text-gray-800">
                            {SELF_STATUS_LABELS[emp.latestResponse.self_status]}
                          </span>
                        </span>
                      )}
                      {emp.latestResponse.family_status && (
                        <span>
                          家族：
                          <span className="text-gray-800">
                            {FAMILY_STATUS_LABELS[emp.latestResponse.family_status]}
                          </span>
                        </span>
                      )}
                      {emp.latestResponse.work_status && (
                        <span>
                          業務：
                          <span className="text-gray-800">
                            {WORK_STATUS_LABELS[emp.latestResponse.work_status]}
                          </span>
                        </span>
                      )}
                    </div>
                    {emp.latestResponse.comment && (
                      <p className="w-full text-xs text-gray-500 mt-0.5 truncate">
                        {emp.latestResponse.comment}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{emp.name}</span>
                    {emp.department && (
                      <span className="text-xs text-gray-400">{emp.department}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
