export type Employee = {
  employee_number: string
  name: string
  email: string
  department: string | null
}

export type Event = {
  event_id: string
  event_type: 'earthquake' | 'test' | 'manual'
  issued_at: string
  earthquake_info_id: string | null
  max_intensity: number | null
  epicenter: string | null
  issuer: string
  comment: string | null
  created_at: string
}

export type Response = {
  id: number
  event_id: string
  employee_number: string
  self_status: 'safe' | 'injured' | 'need_rescue' | null
  family_status: 'safe' | 'injured' | 'need_rescue' | 'checking' | 'not_applicable' | null
  work_status: 'available' | 'unavailable' | null
  comment: string | null
  created_at: string
}

export type StatusGroup = 'critical' | 'checking' | 'unanswered' | 'safe'

export type EmployeeWithStatus = Employee & {
  latestResponse: Response | null
  statusGroup: StatusGroup
}
