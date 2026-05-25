import type { ClassTypeConfig, AttendanceRecord, AttendanceStats } from "../types"

/**
 * Calculates attendance statistics for a specific Class Type Config based on attendance records.
 * 
 * Formulas:
 * - Current % = (Hours Present / Hours Held) * 100
 * - Safe Bunks = floor((100 * P - M * H) / (M * S)) where P = present hours, H = held hours, M = min%, S = hours/session
 * - Classes Needed = ceil((M * H - 100 * P) / (S * (100 - M)))
 * - Projected % = ((Hours Present + Remaining Hours) / Total Hours) * 100
 */
export function calculateAttendanceStats(
  config: ClassTypeConfig,
  records: AttendanceRecord[]
): AttendanceStats {
  const classTypeId = config.id
  const classTypeName = config.name
  const totalHours = config.total_hours
  const hoursPerSession = config.hours_per_session
  const minAttendance = config.min_attendance ?? 75

  // Filter records matching this class type
  const typeRecords = records.filter((r) => r.class_type_id === classTypeId)

  let hoursHeld = 0
  let hoursPresent = 0

  typeRecords.forEach((record) => {
    if (record.status === "PRESENT") {
      hoursHeld += hoursPerSession
      hoursPresent += hoursPerSession
    } else if (record.status === "ABSENT") {
      hoursHeld += hoursPerSession
    }
    // HOLIDAY and CANCELLED statuses do not increment held or present hours
  })

  const currentPercentage = hoursHeld > 0 ? (hoursPresent / hoursHeld) * 100 : 100

  // Calculate safe bunks (only if current attendance >= min required)
  let safeBunks = 0
  if (currentPercentage >= minAttendance) {
    const safeBunksFloat = 
      (100 * hoursPresent - minAttendance * hoursHeld) / (minAttendance * hoursPerSession)
    safeBunks = Math.max(0, Math.floor(safeBunksFloat))
  }

  // Calculate classes needed (only if current attendance < min required)
  let classesNeeded = 0
  if (currentPercentage < minAttendance) {
    const divisor = hoursPerSession * (100 - minAttendance)
    if (divisor > 0) {
      classesNeeded = Math.max(
        0,
        Math.ceil((minAttendance * hoursHeld - 100 * hoursPresent) / divisor)
      )
    } else {
      // If minAttendance is 100%
      classesNeeded = hoursPresent < hoursHeld ? 999 : 0
    }
  }

  // Calculate projected percentage (attending all remaining sessions)
  const remainingHours = Math.max(0, totalHours - hoursHeld)
  const projectedPresent = hoursPresent + remainingHours
  const projectedPercentage = totalHours > 0 ? (projectedPresent / totalHours) * 100 : 100

  // Determine status based on thresholds
  let status: "safe" | "warning" | "danger" = "safe"
  if (currentPercentage < minAttendance) {
    if (projectedPercentage >= minAttendance) {
      status = "warning" // Can still achieve min percentage by attending remaining classes
    } else {
      status = "danger"  // Mathematically impossible to achieve min percentage
    }
  }

  return {
    classTypeId,
    classTypeName,
    totalHours,
    hoursPerSession,
    minAttendance,
    hoursHeld,
    hoursPresent,
    currentPercentage: Math.round(currentPercentage * 100) / 100,
    projectedPercentage: Math.round(projectedPercentage * 100) / 100,
    safeBunks,
    classesNeeded,
    status,
  }
}

/**
 * Utility to calculate aggregated attendance stats for a subject
 */
export interface SubjectStatsSummary {
  currentPercentage: number
  totalHeld: number
  totalPresent: number
  status: "safe" | "warning" | "danger"
}

export function calculateSubjectStats(
  subject: { class_types: ClassTypeConfig[] },
  records: AttendanceRecord[]
): SubjectStatsSummary {
  let totalHeld = 0
  let totalPresent = 0
  let hasDanger = false
  let hasWarning = false

  subject.class_types.forEach((config) => {
    const stats = calculateAttendanceStats(config, records)
    totalHeld += stats.hoursHeld
    totalPresent += stats.hoursPresent
    if (stats.status === "danger") hasDanger = true
    if (stats.status === "warning") hasWarning = true
  })

  const currentPercentage = totalHeld > 0 ? (totalPresent / totalHeld) * 100 : 100

  let status: "safe" | "warning" | "danger" = "safe"
  if (hasDanger) {
    status = "danger"
  } else if (hasWarning) {
    status = "warning"
  }

  return {
    currentPercentage: Math.round(currentPercentage * 100) / 100,
    totalHeld,
    totalPresent,
    status,
  }
}
