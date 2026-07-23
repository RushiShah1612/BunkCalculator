import { useState, useEffect, useCallback, useMemo } from "react"
import { useSubjects } from "./useSubjects"
import { useAttendance } from "./useAttendance"
import { useAuthStore } from "../store/authStore"
import {
  calculateClassTypeStats,
  calculateOverallStats,
  getStreakCount,
} from "../lib/calculations"
import type { AttendanceStats, AttendanceRecord, Subject } from "../types"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubjectWithStats {
  subject: Subject
  classTypeStats: AttendanceStats[]
  overallPct: number
  overallStatus: "safe" | "warning" | "danger"
  totalSafeBunks: number
}

export interface WeeklyBarEntry {
  day: string           // "Mon", "Tue" …
  dateStr: string       // "YYYY-MM-DD"
  [subjectName: string]: number | string
}

export interface DashboardData {
  subjects: Subject[]
  activeSubjects: Subject[]
  subjectStats: SubjectWithStats[]
  allClassTypeStats: AttendanceStats[]
  overallStats: ReturnType<typeof calculateOverallStats>
  streak: number
  weeklyData: WeeklyBarEntry[]
  todayRecords: AttendanceRecord[]
  allRecords: AttendanceRecord[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ─── useDashboardData ─────────────────────────────────────────────────────────

/**
 * Master hook that fetches and derives all data needed for the Dashboard page.
 * Uses Promise.all() for parallel fetches and memoizes calculation results.
 */
export function useDashboardData(): DashboardData {
  const { user } = useAuthStore()
  const { subjects, activeSubjects, fetchSubjects } = useSubjects()
  const { fetchRecordsByDate, fetchAllRecords } = useAttendance()

  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([])
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const refresh = useCallback(() => setRefreshToken((t) => t + 1), [])

  // ── Fetch all data in parallel ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const now = new Date()
      const todayStr = toLocalDateStr(now)

      const [, allRecs, todayRecs] = await Promise.all([
        fetchSubjects(),
        fetchAllRecords(),
        fetchRecordsByDate(todayStr),
      ])

      setAllRecords(allRecs)
      setTodayRecords(todayRecs)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard"
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [user, fetchSubjects, fetchAllRecords, fetchRecordsByDate])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAll()
    }, 0)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken])

  // ── Memoised calculations ──────────────────────────────────────────────────

  /** All AttendanceStats objects (one per class type) */
  const allClassTypeStats = useMemo<AttendanceStats[]>(() => {
    const stats: AttendanceStats[] = []
    for (const subject of subjects) {
      for (const ct of subject.class_types) {
        stats.push(calculateClassTypeStats(ct, allRecords, subject.min_attendance))
      }
    }
    return stats
  }, [subjects, allRecords])

  /** Per-subject rollup stats */
  const subjectStats = useMemo<SubjectWithStats[]>(() => {
    return subjects.map((subject) => {
      const ctStats = subject.class_types.map((ct) =>
        calculateClassTypeStats(ct, allRecords, subject.min_attendance)
      )
      const agg = calculateOverallStats(ctStats)
      const worstStatus: "safe" | "warning" | "danger" =
        ctStats.some((s) => s.status === "danger")
          ? "danger"
          : ctStats.some((s) => s.status === "warning")
          ? "warning"
          : "safe"

      return {
        subject,
        classTypeStats: ctStats,
        overallPct: agg.overallPercentage,
        overallStatus: worstStatus,
        totalSafeBunks: agg.totalSafeBunks,
      }
    })
  }, [subjects, allRecords])

  /** Global aggregated stats */
  const overallStats = useMemo(
    () => calculateOverallStats(allClassTypeStats),
    [allClassTypeStats]
  )

  /** Consecutive present-day streak */
  const streak = useMemo(() => getStreakCount(allRecords), [allRecords])

  /** Weekly bar chart data (last 7 days, stacked by subject) */
  const weeklyData = useMemo<WeeklyBarEntry[]>(() => {
    const entries: WeeklyBarEntry[] = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dateStr = toLocalDateStr(d)
      const entry: WeeklyBarEntry = {
        day: DAY_LABELS[d.getDay()],
        dateStr,
      }

      for (const subject of subjects) {
        let hoursPresent = 0
        for (const ct of subject.class_types) {
          const dayRecs = allRecords.filter(
            (r) =>
              r.class_type_id === ct.id &&
              r.date.slice(0, 10) === dateStr &&
              r.status === "PRESENT"
          )
          hoursPresent += dayRecs.length * ct.hours_per_session
        }
        entry[subject.name] = hoursPresent
      }

      entries.push(entry)
    }
    return entries
  }, [subjects, allRecords])

  return {
    subjects,
    activeSubjects,
    subjectStats,
    allClassTypeStats,
    overallStats,
    streak,
    weeklyData,
    todayRecords,
    allRecords,
    isLoading,
    error,
    refresh,
  }
}
