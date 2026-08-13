export type EmployeeRow = {
  employee_number: string
  name: string
  email: string
  department: string | null
  is_active: boolean
}

// GASの生2次元配列（A〜E列）をEmployeeRowに変換。
// 列順: [社員番号, 氏名, メール, 部門, 退職FLG]
// 空行・メールに@なし行・重複社員番号はスキップ。
// 退職FLG: 空欄=在籍(true)、●=退職(false)
export function parseGasRows(rows: unknown[][]): EmployeeRow[] {
  const result: EmployeeRow[] = []
  const seenNumbers = new Set<string>()
  const seenEmails  = new Set<string>()
  for (const row of rows) {
    const employeeNumber = String(row[0] ?? '').trim()
    const name           = String(row[1] ?? '').trim()
    const email          = String(row[2] ?? '').trim().toLowerCase()
    const department     = String(row[3] ?? '').trim() || null
    const retiredFlag    = String(row[4] ?? '').trim()

    if (!employeeNumber || !name || !email || !email.includes('@')) continue
    if (seenNumbers.has(employeeNumber) || seenEmails.has(email)) continue
    seenNumbers.add(employeeNumber)
    seenEmails.add(email)

    result.push({
      employee_number: employeeNumber,
      name,
      email,
      department,
      is_active: retiredFlag !== '●',
    })
  }
  return result
}
