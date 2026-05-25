import type { AttendanceRecord, AttendanceStats, ClassTypeConfig } from "../types"

// ─── A) calculateCurrentPercentage ───────────────────────────────────────────

/**
 * Calculates the current attendance percentage based on hours attended vs held.
 *
 * @param hoursPresent - Total hours the student was present
 * @param hoursHeld    - Total hours classes were held (excludes CANCELLED/HOLIDAY)
 * @returns Percentage rounded to 2 decimal places; 0 if no classes held yet
 *
 * @example
 * calculateCurrentPercentage(30, 40) // → 75.00
 */
export function calculateCurrentPercentage(
  hoursPresent: number,
  hoursHeld: number
): number {
  if (hoursHeld === 0) return 0
  return Math.round((hoursPresent / hoursHeld) * 100 * 100) / 100
}

// ─── B) calculateProjectedPercentage ─────────────────────────────────────────

/**
 * Calculates the worst-case projected attendance percentage if the student
 * misses ALL remaining classes for the semester.
 *
 * @param hoursPresent         - Hours already attended
 * @param totalSemesterHours   - Full semester hour count for this class type
 * @returns Projected percentage rounded to 2 decimal places
 *
 * @example
 * calculateProjectedPercentage(30, 60) // → 50.00 (if you miss all 30 remaining)
 */
export function calculateProjectedPercentage(
  hoursPresent: number,
  totalSemesterHours: number
): number {
  if (totalSemesterHours === 0) return 0
  return Math.round((hoursPresent / totalSemesterHours) * 100 * 100) / 100
}

// ─── C) calculateSafeBunks ───────────────────────────────────────────────────

/**
 * Calculates how many additional sessions the student can safely skip while
 * still meeting the minimum attendance requirement at end of semester.
 *
 * Formula:
 *   requiredHours = (minAttendancePercent / 100) × totalSemesterHours
 *   hoursCan miss  = hoursPresent − requiredHours
 *   safeSessions   = floor(hoursCan miss / hoursPerSession)
 *
 * @param hoursPresent          - Current hours attended
 * @param hoursHeld             - Current hours classes were held
 * @param totalSemesterHours    - Total planned hours for the semester
 * @param minAttendancePercent  - Minimum required attendance percentage (e.g. 75)
 * @param hoursPerSession       - Duration of each session in hours
 * @returns Number of sessions that can still be bunked; minimum 0
 *
 * @example
 * calculateSafeBunks(40, 45, 60, 75, 1) // → positive number; can skip some classes
 */
export function calculateSafeBunks(
  hoursPresent: number,
  hoursHeld: number,
  totalSemesterHours: number,
  minAttendancePercent: number,
  hoursPerSession: number
): number {
  if (hoursPerSession <= 0) return 0
  const requiredHours = (minAttendancePercent / 100) * totalSemesterHours
  const hoursCanMiss = hoursPresent - requiredHours
  const safeSessions = Math.floor(hoursCanMiss / hoursPerSession)
  // Suppress unused parameter warning — hoursHeld is intentionally kept for
  // API symmetry and future-proofing (e.g. current % guard callers may add).
  void hoursHeld
  return Math.max(0, safeSessions)
}

// ─── D) calculateClassesNeeded ───────────────────────────────────────────────

/**
 * Calculates how many additional consecutive sessions the student must attend
 * to bring their attendance back up to the minimum required percentage.
 *
 * Only relevant when the student is currently below the minimum.
 *
 * Formula:
 *   needed (hours) = ceil(
 *     (minPercent × totalHours − 100 × hoursPresent) / (100 − minPercent)
 *   )
 *   needed (sessions) = ceil(needed / hoursPerSession)
 *
 * @param hoursPresent          - Current hours attended
 * @param hoursHeld             - Current hours classes were held (unused in formula but kept for API parity)
 * @param totalSemesterHours    - Total planned hours for the semester
 * @param minAttendancePercent  - Minimum required attendance percentage (e.g. 75)
 * @param hoursPerSession       - Duration of each session in hours
 * @returns Number of sessions that must be attended; 0 if already above minimum
 *
 * @example
 * calculateClassesNeeded(18, 30, 60, 75, 1) // → number of sessions to recover
 */
export function calculateClassesNeeded(
  hoursPresent: number,
  hoursHeld: number,
  totalSemesterHours: number,
  minAttendancePercent: number,
  hoursPerSession: number
): number {
  // Suppress unused parameter warning
  void hoursHeld

  if (hoursPerSession <= 0) return 0

  const minFraction = minAttendancePercent / 100
  const currentPerc = calculateCurrentPercentage(hoursPresent, totalSemesterHours)

  // Already meeting requirement
  if (currentPerc >= minAttendancePercent) return 0

  // When minAttendancePercent is 100, formula denominator → 0; return large sentinel
  const denominator = 100 - minAttendancePercent
  if (denominator <= 0) return 999

  const neededHours = Math.ceil(
    (minFraction * totalSemesterHours - hoursPresent) / (1 - minFraction)
  )
  if (neededHours <= 0) return 0

  return Math.ceil(neededHours / hoursPerSession)
}

// ─── E) calculateAttendanceStatus ────────────────────────────────────────────

/**
 * Determines the status label for a student's current attendance percentage.
 *
 * - "danger"  → below the minimum required percentage
 * - "warning" → within 5 percentage points above the minimum
 * - "safe"    → more than 5 percentage points above the minimum
 *
 * @param currentPercentage     - The student's actual current percentage
 * @param minAttendancePercent  - The minimum required attendance percentage
 * @returns Status string: "safe" | "warning" | "danger"
 *
 * @example
 * calculateAttendanceStatus(74, 75)  // → "danger"
 * calculateAttendanceStatus(78, 75)  // → "warning"
 * calculateAttendanceStatus(85, 75)  // → "safe"
 */
export function calculateAttendanceStatus(
  currentPercentage: number,
  minAttendancePercent: number
): "safe" | "warning" | "danger" {
  if (currentPercentage < minAttendancePercent) return "danger"
  if (currentPercentage <= minAttendancePercent + 5) return "warning"
  return "safe"
}

// ─── F) simulateAttendance ───────────────────────────────────────────────────

/**
 * Simulates how a student's attendance statistics would change if they were to
 * attend a given number of additional classes and/or skip a given number.
 *
 * @param hoursPresent          - Current hours attended
 * @param hoursHeld             - Current hours classes were held
 * @param totalSemesterHours    - Total planned hours for the semester
 * @param minAttendancePercent  - Minimum required attendance percentage
 * @param additionalPresent     - Number of future sessions planning to attend
 * @param additionalAbsent      - Number of future sessions planning to skip
 * @returns Projected statistics after the hypothetical scenario
 *
 * @example
 * simulateAttendance(30, 40, 60, 75, 5, 0) // → attends 5 more → improved %
 */
export function simulateAttendance(
  hoursPresent: number,
  hoursHeld: number,
  totalSemesterHours: number,
  minAttendancePercent: number,
  additionalPresent: number,
  additionalAbsent: number
): {
  projectedPercentage: number
  projectedHeld: number
  projectedPresent: number
  status: "safe" | "warning" | "danger"
  safeBunksAfter: number
} {
  // Derive hours per session from hoursHeld if possible, else fall back to 1
  const hoursPerSession = 1

  const projectedPresent = hoursPresent + additionalPresent
  const projectedHeld =
    hoursHeld + additionalPresent + additionalAbsent

  const projectedPercentage =
    projectedHeld > 0
      ? Math.round((projectedPresent / projectedHeld) * 100 * 100) / 100
      : 0

  const status = calculateAttendanceStatus(projectedPercentage, minAttendancePercent)

  const safeBunksAfter = calculateSafeBunks(
    projectedPresent,
    projectedHeld,
    totalSemesterHours,
    minAttendancePercent,
    hoursPerSession
  )

  return {
    projectedPercentage,
    projectedHeld,
    projectedPresent,
    status,
    safeBunksAfter,
  }
}

// ─── G) calculateOverallStats ─────────────────────────────────────────────────

/**
 * Aggregates attendance statistics across all class types (and subjects),
 * weighting the overall percentage by each class type's total hours.
 *
 * @param statsArray - Array of AttendanceStats objects (one per class type)
 * @returns Aggregated stats: overall percentage, total safe bunks, risk counts
 *
 * @example
 * calculateOverallStats([stats1, stats2]) // → { overallPercentage: 78.5, ... }
 */
export function calculateOverallStats(statsArray: AttendanceStats[]): {
  overallPercentage: number
  totalSafeBunks: number
  subjectsAtRisk: number
  subjectsInWarning: number
} {
  if (statsArray.length === 0) {
    return {
      overallPercentage: 0,
      totalSafeBunks: 0,
      subjectsAtRisk: 0,
      subjectsInWarning: 0,
    }
  }

  let weightedSum = 0
  let totalWeight = 0
  let totalSafeBunks = 0
  let subjectsAtRisk = 0
  let subjectsInWarning = 0

  for (const stats of statsArray) {
    const weight = stats.totalHours
    weightedSum += stats.currentPercentage * weight
    totalWeight += weight
    totalSafeBunks += stats.safeBunks

    if (stats.status === "danger") subjectsAtRisk++
    else if (stats.status === "warning") subjectsInWarning++
  }

  const overallPercentage =
    totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 100) / 100
      : 0

  return {
    overallPercentage,
    totalSafeBunks,
    subjectsAtRisk,
    subjectsInWarning,
  }
}

// ─── H) calculateClassTypeStats ───────────────────────────────────────────────

/**
 * Main aggregator: derives a complete AttendanceStats object for a class type
 * by filtering the records array and running all calculation functions.
 *
 * CANCELLED and HOLIDAY records are excluded from hoursHeld / hoursPresent.
 *
 * @param classType - The ClassTypeConfig for the class (contains thresholds & hours)
 * @param records   - Full list of AttendanceRecord objects (will be filtered internally)
 * @returns Complete AttendanceStats for this class type
 *
 * @example
 * calculateClassTypeStats(theoryConfig, allRecords) // → AttendanceStats
 */
export function calculateClassTypeStats(
  classType: ClassTypeConfig,
  records: AttendanceRecord[]
): AttendanceStats {
  const typeRecords = records.filter(
    (r) => r.class_type_id === classType.id
  )

  let hoursHeld = 0
  let hoursPresent = 0

  for (const record of typeRecords) {
    if (record.status === "PRESENT") {
      hoursHeld += classType.hours_per_session
      hoursPresent += classType.hours_per_session
    } else if (record.status === "ABSENT") {
      hoursHeld += classType.hours_per_session
      // CANCELLED and HOLIDAY: skip both
    }
  }

  const currentPercentage = calculateCurrentPercentage(hoursPresent, hoursHeld)
  const projectedPercentage = calculateProjectedPercentage(
    hoursPresent,
    classType.total_hours
  )
  const safeBunks = calculateSafeBunks(
    hoursPresent,
    hoursHeld,
    classType.total_hours,
    classType.min_attendance,
    classType.hours_per_session
  )
  const classesNeeded = calculateClassesNeeded(
    hoursPresent,
    hoursHeld,
    classType.total_hours,
    classType.min_attendance,
    classType.hours_per_session
  )
  const status = calculateAttendanceStatus(
    currentPercentage,
    classType.min_attendance
  )

  return {
    classTypeId: classType.id,
    classTypeName: classType.name,
    totalHours: classType.total_hours,
    hoursPerSession: classType.hours_per_session,
    minAttendance: classType.min_attendance,
    hoursHeld,
    hoursPresent,
    currentPercentage,
    projectedPercentage,
    safeBunks,
    classesNeeded,
    status,
  }
}

// ─── I) getStreakCount ────────────────────────────────────────────────────────

/**
 * Counts the number of consecutive calendar days (ending at `checkDate` or
 * today) on which the student had at least one PRESENT record.
 *
 * The streak breaks the first day (going backwards) where ONLY ABSENT records
 * exist for that day, or where there are no records at all.
 *
 * CANCELLED and HOLIDAY records are ignored when evaluating a day.
 *
 * @param records   - Full array of AttendanceRecord objects (any class type)
 * @param checkDate - Optional reference date; defaults to today
 * @returns Number of consecutive present days
 *
 * @example
 * getStreakCount(records)          // → count ending today
 * getStreakCount(records, someDate) // → count ending on that date
 */
export function getStreakCount(
  records: AttendanceRecord[],
  checkDate?: Date
): number {
  const endDate = checkDate ? new Date(checkDate) : new Date()
  endDate.setHours(0, 0, 0, 0)

  // Build a map: dateString → AttendanceRecord[]
  const byDate: Record<string, AttendanceRecord[]> = {}
  for (const record of records) {
    const day = record.date.slice(0, 10) // "YYYY-MM-DD"
    if (!byDate[day]) byDate[day] = []
    byDate[day].push(record)
  }

  let streak = 0
  const cursor = new Date(endDate)

  // Format a Date as local YYYY-MM-DD (avoids UTC off-by-one in UTC+ timezones)
  const toLocalDateStr = (d: Date): string => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  while (true) {
    const key = toLocalDateStr(cursor)
    const dayRecords = byDate[key] ?? []

    // Filter out CANCELLED / HOLIDAY
    const meaningful = dayRecords.filter(
      (r) => r.status === "PRESENT" || r.status === "ABSENT"
    )

    const hasPresent = meaningful.some((r) => r.status === "PRESENT")
    const hasAbsent = meaningful.some((r) => r.status === "ABSENT")
    const hasOnlyAbsent = !hasPresent && hasAbsent

    if (hasPresent) {
      streak++
    } else if (hasOnlyAbsent || meaningful.length === 0) {
      // No present record today — streak ends
      break
    }

    // Move one day back
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

// ─── Legacy re-exports (kept for backward compatibility) ─────────────────────

/**
 * @deprecated Use `calculateClassTypeStats` instead.
 * Kept for backward compatibility with existing components.
 */
export const calculateAttendanceStats = calculateClassTypeStats

export interface SubjectStatsSummary {
  currentPercentage: number
  totalHeld: number
  totalPresent: number
  status: "safe" | "warning" | "danger"
}

/**
 * Aggregates stats for an entire subject across all its class types.
 * Returns the worst-case status from any of the class types.
 */
export function calculateSubjectStats(
  subject: { class_types: ClassTypeConfig[] },
  records: AttendanceRecord[]
): SubjectStatsSummary {
  let totalHeld = 0
  let totalPresent = 0
  let hasDanger = false
  let hasWarning = false

  for (const config of subject.class_types) {
    const stats = calculateClassTypeStats(config, records)
    totalHeld += stats.hoursHeld
    totalPresent += stats.hoursPresent
    if (stats.status === "danger") hasDanger = true
    if (stats.status === "warning") hasWarning = true
  }

  const currentPercentage = totalHeld > 0 ? (totalPresent / totalHeld) * 100 : 100

  let status: "safe" | "warning" | "danger" = "safe"
  if (hasDanger) status = "danger"
  else if (hasWarning) status = "warning"

  return {
    currentPercentage: Math.round(currentPercentage * 100) / 100,
    totalHeld,
    totalPresent,
    status,
  }
}
