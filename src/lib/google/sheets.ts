import 'server-only'
import { google } from 'googleapis'

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('Google サービスアカウントの認証情報が設定されていません')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  return google.sheets({ version: 'v4', auth })
}

export type SheetEmployee = {
  employee_number: string
  name: string
  email: string
  department: string | null
  is_active: boolean
}

const HEADERS = {
  employee_number: '社員番号',
  name: '氏名',
  email: 'メールアドレス',
  department: '部門',
  is_active: '在籍フラグ',
} as const

function parseIsActive(value: string | undefined): boolean {
  if (!value) return false
  const v = value.trim().toLowerCase()
  return v === 'true' || v === '1' || v === '○' || v === 'yes' || v === '在籍'
}

export async function fetchEmployeesFromSheet(): Promise<SheetEmployee[]> {
  const spreadsheetId = process.env.EMPLOYEE_SPREADSHEET_ID
  const sheetName = process.env.EMPLOYEE_SHEET_NAME ?? 'Sheet1'

  if (!spreadsheetId) {
    throw new Error('EMPLOYEE_SPREADSHEET_ID が設定されていません')
  }

  const sheets = getSheetsClient()
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  })

  const rows = response.data.values
  if (!rows || rows.length < 2) {
    return []
  }

  const headerRow = rows[0] as string[]
  const colIndex = {
    employee_number: headerRow.indexOf(HEADERS.employee_number),
    name: headerRow.indexOf(HEADERS.name),
    email: headerRow.indexOf(HEADERS.email),
    department: headerRow.indexOf(HEADERS.department),
    is_active: headerRow.indexOf(HEADERS.is_active),
  }

  const missing = (Object.entries(colIndex) as [keyof typeof colIndex, number][])
    .filter(([, i]) => i === -1)
    .map(([k]) => HEADERS[k])

  if (missing.length > 0) {
    throw new Error(`スプレッドシートに必要な列が見つかりません: ${missing.join(', ')}`)
  }

  return rows
    .slice(1)
    .filter((row) => (row[colIndex.employee_number] as string | undefined)?.trim())
    .map((row) => ({
      employee_number: String(row[colIndex.employee_number]).trim(),
      name: String(row[colIndex.name] ?? '').trim(),
      email: String(row[colIndex.email] ?? '').trim().toLowerCase(),
      department: (row[colIndex.department] as string | undefined)?.trim() || null,
      is_active: parseIsActive(row[colIndex.is_active] as string | undefined),
    }))
    .filter((e) => e.email)
}
