export const SELF_OPTIONS = [
  { value: 'safe',        label: '無事' },
  { value: 'injured',     label: '負傷' },
  { value: 'need_rescue', label: '救助必要' },
]

export const FAMILY_ROWS = [
  [
    { value: 'safe',        label: '無事' },
    { value: 'injured',     label: '負傷' },
    { value: 'need_rescue', label: '救助必要' },
  ],
  [
    { value: 'not_applicable', label: '確認不要' },
    { value: 'checking',       label: '確認中' },
  ],
]

export const WORK_OPTIONS = [
  { value: 'available',   label: '対応可能' },
  { value: 'unavailable', label: '対応困難' },
]

const LABEL_CLASS = 'flex-1 flex items-center justify-center text-center py-5 px-1 text-xs font-medium cursor-pointer leading-snug transition-colors text-gray-500 bg-white hover:bg-gray-50 has-[:checked]:bg-gray-700 has-[:checked]:text-white has-[:checked]:font-bold'

export function RadioGroup({
  name,
  legend,
  options,
  rows,
  defaultValue,
}: {
  name: string
  legend: string
  options?: { value: string; label: string }[]
  rows?: { value: string; label: string }[][]
  defaultValue?: string | null
}) {
  const renderRow = (row: { value: string; label: string }[]) =>
    row.map(({ value, label }) => (
      <label key={value} className={LABEL_CLASS}>
        <input
          type="radio"
          name={name}
          value={value}
          required
          defaultChecked={defaultValue === value}
          className="sr-only"
        />
        {label}
      </label>
    ))

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-gray-700 mb-1.5">
        {legend}<span className="text-red-500 ml-1">*</span>
      </legend>
      <div className="border border-gray-200">
        {rows
          ? rows.map((row, i) => (
              <div key={i} className={`flex divide-x divide-gray-200${i > 0 ? ' border-t border-gray-200' : ''}`}>
                {renderRow(row)}
              </div>
            ))
          : <div className="flex divide-x divide-gray-200">{renderRow(options ?? [])}</div>
        }
      </div>
    </fieldset>
  )
}
