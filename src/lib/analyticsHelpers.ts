import type { AttendanceRecord, AttendanceStats, ClassTypeConfig, Subject } from "../types"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  date: string        // "YYYY-MM-DD"
  label: string       // formatted label for axis
  [subjectId: string]: number | string  // dynamic per-subject percentage
}

export interface ComparisonPoint {
  subject: string     // short code or truncated name
  subjectId: string
  hoursPresent: number
  hoursAbsent: number
  color: string
}

export interface ClassTypeBreakdownPoint {
  name: string        // class type name
  hours: number
  percentage: number
  color: string
}

export interface HeatmapCell {
  date: string        // "YYYY-MM-DD"
  total: number       // total classes held
  present: number     // classes attended
  intensity: "none" | "full" | "partial" | "absent" | "noclass"
  tooltip: string
}

// ─── Color palette for class types ──────────────────────────────────────────

const CLASS_TYPE_COLORS: Record<string, string> = {
  Theory:   "#6366f1",
  Lab:      "#22c55e",
  Tutorial: "#f59e0b",
  Seminar:  "#ec4899",
  Project:  "#14b8a6",
}

function classTypeColor(name: string, idx: number): string {
  if (CLASS_TYPE_COLORS[name]) return CLASS_TYPE_COLORS[name]
  const palette = ["#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#e879f9"]
  return palette[idx % palette.length]
}

// ─── toLocalDateStr ──────────────────────────────────────────────────────────

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// ─── buildTimeSeriesData ─────────────────────────────────────────────────────

/**
 * Builds cumulative attendance % per subject over time.
 * For each day in the date range, calculates the running cumulative % for each subject.
 */
export function buildTimeSeriesData(
  records: AttendanceRecord[],
  classTypes: ClassTypeConfig[],
  subjects: Subject[],
  subjectIds?: string[]
): TimeSeriesPoint[] {
  if (records.length === 0 || subjects.length === 0) return []

  const filteredSubjects = subjectIds?.length
    ? subjects.filter((s) => subjectIds.includes(s.id))
    : subjects

  // Map classTypeId → subject
  const ctToSubject: Record<string, Subject> = {}
  for (const sub of filteredSubjects) {
    for (const ct of sub.class_types) {
      ctToSubject[ct.id] = sub
    }
  }

  // Map classTypeId → hoursPerSession
  const ctHours: Record<string, number> = {}
  for (const ct of classTypes) {
    ctHours[ct.id] = ct.hours_per_session
  }

  // Group records by date, then accumulate per-subject counters
  const sortedDates = [
    ...new Set(records.map((r) => r.date.slice(0, 10))),
  ].sort()

  if (sortedDates.length === 0) return []

  // Running accumulators
  const held: Record<string, number> = {}
  const present: Record<string, number> = {}
  for (const sub of filteredSubjects) {
    held[sub.id] = 0
    present[sub.id] = 0
  }

  const points: TimeSeriesPoint[] = []

  for (const dateStr of sortedDates) {
    const dayRecords = records.filter((r) => r.date.slice(0, 10) === dateStr)

    for (const r of dayRecords) {
      const sub = ctToSubject[r.class_type_id]
      if (!sub) continue
      const hrs = ctHours[r.class_type_id] ?? 1

      if (r.status === "PRESENT") {
        held[sub.id] += hrs
        present[sub.id] += hrs
      } else if (r.status === "ABSENT") {
        held[sub.id] += hrs
      }
    }

    const point: TimeSeriesPoint = {
      date: dateStr,
      label: new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
    }

    for (const sub of filteredSubjects) {
      const pct = held[sub.id] > 0
        ? Math.round((present[sub.id] / held[sub.id]) * 100 * 10) / 10
        : 0
      point[sub.id] = pct
    }

    points.push(point)
  }

  return points
}

// ─── buildSubjectComparisonData ──────────────────────────────────────────────

/**
 * Builds present vs absent hours per subject for the grouped bar chart.
 */
export function buildSubjectComparisonData(
  allStats: AttendanceStats[],
  subjects: Subject[]
): ComparisonPoint[] {
  // Group stats by subject
  const bySubject: Record<string, { present: number; absent: number; color: string; name: string }> = {}

  for (const sub of subjects) {
    bySubject[sub.id] = {
      present: 0,
      absent: 0,
      color: sub.color_tag,
      name: sub.code || sub.name.slice(0, 8),
    }
  }

  for (const stats of allStats) {
    // Find which subject owns this classTypeId
    const sub = subjects.find((s) =>
      s.class_types.some((ct) => ct.id === stats.classTypeId)
    )
    if (!sub || !bySubject[sub.id]) continue
    bySubject[sub.id].present += stats.hoursPresent
    bySubject[sub.id].absent += stats.hoursHeld - stats.hoursPresent
  }

  return subjects
    .filter((s) => bySubject[s.id])
    .map((s) => ({
      subject: bySubject[s.id].name,
      subjectId: s.id,
      hoursPresent: Math.round(bySubject[s.id].present * 10) / 10,
      hoursAbsent: Math.round(bySubject[s.id].absent * 10) / 10,
      color: bySubject[s.id].color,
    }))
}

// ─── buildClassTypeBreakdown ─────────────────────────────────────────────────

/**
 * Aggregates total hours by class type name across all subjects for the donut chart.
 */
export function buildClassTypeBreakdown(subjects: Subject[]): ClassTypeBreakdownPoint[] {
  const totals: Record<string, number> = {}

  for (const sub of subjects) {
    for (const ct of sub.class_types) {
      if (!totals[ct.name]) totals[ct.name] = 0
      totals[ct.name] += ct.total_hours
    }
  }

  const entries = Object.entries(totals)
  const grandTotal = entries.reduce((s, [, v]) => s + v, 0)

  return entries.map(([name, hours], idx) => ({
    name,
    hours,
    percentage: grandTotal > 0 ? Math.round((hours / grandTotal) * 100) : 0,
    color: classTypeColor(name, idx),
  }))
}

// ─── buildHeatmapData ────────────────────────────────────────────────────────

/**
 * Builds an array of heatmap cells (one per calendar day) for the last N months.
 */
export function buildHeatmapData(
  records: AttendanceRecord[],
  monthsBack = 3
): HeatmapCell[] {
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth() - (monthsBack - 1), 1)

  // Group records by date
  const byDate: Record<string, AttendanceRecord[]> = {}
  for (const r of records) {
    const d = r.date.slice(0, 10)
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(r)
  }

  const cells: HeatmapCell[] = []
  const cursor = new Date(startDate)
  cursor.setHours(0, 0, 0, 0)

  while (cursor <= today) {
    const dateStr = toLocalDateStr(cursor)
    const dayRecs = byDate[dateStr] ?? []

    const meaningful = dayRecs.filter(
      (r) => r.status === "PRESENT" || r.status === "ABSENT"
    )
    const presentCount = meaningful.filter((r) => r.status === "PRESENT").length
    const total = meaningful.length

    let intensity: HeatmapCell["intensity"] = "noclass"
    let tooltip = `${dateStr}: No classes`

    if (total > 0) {
      if (presentCount === total) {
        intensity = "full"
        tooltip = `${dateStr}: Attended all ${total} class${total > 1 ? "es" : ""}`
      } else if (presentCount > 0) {
        intensity = "partial"
        tooltip = `${dateStr}: Attended ${presentCount}/${total} classes`
      } else {
        intensity = "absent"
        tooltip = `${dateStr}: Absent — missed ${total} class${total > 1 ? "es" : ""}`
      }
    } else if (dayRecs.length > 0) {
      intensity = "none"
      tooltip = `${dateStr}: Cancelled / Holiday`
    }

    cells.push({ date: dateStr, total, present: presentCount, intensity, tooltip })
    cursor.setDate(cursor.getDate() + 1)
  }

  return cells
}

// ─── generateCSV ─────────────────────────────────────────────────────────────

/**
 * Generates a CSV string from attendance records enriched with subject/class-type info.
 */
export function generateCSV(
  records: AttendanceRecord[],
  subjects: Subject[]
): string {
  // Build lookup maps
  const ctMap: Record<string, { name: string; hours_per_session: number; subjectId: string }> = {}
  const subMap: Record<string, string> = {}

  for (const sub of subjects) {
    subMap[sub.id] = sub.name
    for (const ct of sub.class_types) {
      ctMap[ct.id] = {
        name: ct.name,
        hours_per_session: ct.hours_per_session,
        subjectId: sub.id,
      }
    }
  }

  const header = ["Date", "Subject", "Class Type", "Status", "Hours", "Notes"]

  const rows = records
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((r) => {
      const ct = ctMap[r.class_type_id]
      const subjectName = ct ? (subMap[ct.subjectId] ?? "") : ""
      const ctName = ct?.name ?? ""
      const hours = ct?.hours_per_session ?? ""
      const notes = r.notes ? `"${r.notes.replace(/"/g, '""')}"` : ""
      return [r.date.slice(0, 10), `"${subjectName}"`, ctName, r.status, hours, notes].join(",")
    })

  return [header.join(","), ...rows].join("\n")
}

// ─── downloadCSV ─────────────────────────────────────────────────────────────

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Date range helpers ──────────────────────────────────────────────────────

export type DateRangePreset = "week" | "month" | "semester" | "custom"

export function getDateRangeDates(preset: DateRangePreset, custom?: { from: string; to: string }): { from: string; to: string } {
  const today = new Date()
  const to = toLocalDateStr(today)

  if (preset === "week") {
    const from = new Date(today)
    from.setDate(today.getDate() - 6)
    return { from: toLocalDateStr(from), to }
  }
  if (preset === "month") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: toLocalDateStr(from), to }
  }
  if (preset === "semester") {
    const from = new Date(today.getFullYear(), today.getMonth() - 5, 1)
    return { from: toLocalDateStr(from), to }
  }
  if (preset === "custom" && custom) {
    return custom
  }
  // default: month
  const from = new Date(today.getFullYear(), today.getMonth(), 1)
  return { from: toLocalDateStr(from), to }
}
