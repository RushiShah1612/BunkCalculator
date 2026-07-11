export type ClassTypeName = 
  | "Theory" 
  | "Lab" 
  | "Tutorial" 
  | "Seminar" 
  | "Project" 
  | string

export interface ClassTypeConfig {
  id: string
  subject_id: string
  name: ClassTypeName
  total_hours: number
  hours_per_session: number
  timetable_days?: string[]
  created_at: string
}

export interface Subject {
  id: string
  user_id: string
  name: string
  code: string | null
  color_tag: string
  credits: number | null
  semester: string | null
  min_attendance: number      // default 75
  class_types: ClassTypeConfig[]
  created_at: string
}

export type AttendanceStatus = 
  | "PRESENT" 
  | "ABSENT" 
  | "CANCELLED" 
  | "HOLIDAY"

export interface AttendanceRecord {
  id: string
  class_type_id: string
  date: string               // ISO string
  status: AttendanceStatus
  notes: string | null
  created_at: string
}

export interface AttendanceStats {
  classTypeId: string
  classTypeName: string
  totalHours: number
  hoursPerSession: number
  minAttendance: number
  hoursHeld: number
  hoursPresent: number
  currentPercentage: number
  projectedPercentage: number
  safeBunks: number
  classesNeeded: number
  status: "safe" | "warning" | "danger"
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  institution: string | null
  semester: string | null
  default_min_attendance?: number
  created_at: string
}
