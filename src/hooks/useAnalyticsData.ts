import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "../lib/supabase"
import { useAuthStore } from "../store/authStore"
import { useSubjectStore } from "../store/subjectStore"
import { calculateClassTypeStats } from "../lib/calculations"
import {
  buildTimeSeriesData,
  buildSubjectComparisonData,
  buildClassTypeBreakdown,
  buildHeatmapData,
  getDateRangeDates,
  type DateRangePreset,
  type TimeSeriesPoint,
  type ComparisonPoint,
  type ClassTypeBreakdownPoint,
  type HeatmapCell,
} from "../lib/analyticsHelpers"
import type { AttendanceRecord, AttendanceStats } from "../types"

export interface AnalyticsFilters {
  preset: DateRangePreset
  customFrom: string
  customTo: string
  subjectIds: string[]  // empty = all
}

export interface AnalyticsData {
  allRecords: AttendanceRecord[]
  filteredRecords: AttendanceRecord[]
  allStats: AttendanceStats[]
  timeSeries: TimeSeriesPoint[]
  comparison: ComparisonPoint[]
  classTypeBreakdown: ClassTypeBreakdownPoint[]
  heatmap: HeatmapCell[]
  loading: boolean
  filters: AnalyticsFilters
  setFilters: (f: Partial<AnalyticsFilters>) => void
  refresh: () => void
}

const DEFAULT_FILTERS: AnalyticsFilters = {
  preset: "semester",
  customFrom: "",
  customTo: "",
  subjectIds: [],
}

export function useAnalyticsData(): AnalyticsData {
  const { user } = useAuthStore()
  const { subjects } = useSubjectStore()

  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshToken, setRefreshToken] = useState(0)
  const [filters, setFiltersState] = useState<AnalyticsFilters>(DEFAULT_FILTERS)

  const setFilters = useCallback((partial: Partial<AnalyticsFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }))
  }, [])

  const refresh = useCallback(() => setRefreshToken((t) => t + 1), [])

  // Fetch ALL records for this user (analytics needs full history)
  useEffect(() => {
    if (!user) return
    const timer = setTimeout(() => {
      setLoading(true)

      supabase
        .from("attendance_records")
        .select("*, class_types!inner(subject_id, subjects!inner(user_id))")
        .eq("class_types.subjects.user_id", user.id)
        .order("date", { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) {
            setAllRecords(data as AttendanceRecord[])
          }
          setLoading(false)
        })
    }, 0)

    return () => clearTimeout(timer)
  }, [user, refreshToken])

  // Derive date range from filters
  const dateRange = useMemo(() => {
    return getDateRangeDates(
      filters.preset,
      filters.preset === "custom"
        ? { from: filters.customFrom, to: filters.customTo }
        : undefined
    )
  }, [filters])

  // Filter records by date range + subject selection
  const filteredRecords = useMemo(() => {
    const classTypeIds = new Set<string>()

    if (filters.subjectIds.length > 0) {
      for (const sub of subjects) {
        if (filters.subjectIds.includes(sub.id)) {
          for (const ct of sub.class_types) classTypeIds.add(ct.id)
        }
      }
    }

    return allRecords.filter((r) => {
      const d = r.date.slice(0, 10)
      if (d < dateRange.from || d > dateRange.to) return false
      if (classTypeIds.size > 0 && !classTypeIds.has(r.class_type_id)) return false
      return true
    })
  }, [allRecords, filters.subjectIds, subjects, dateRange])

  // Compute AttendanceStats for every class type across all subjects
  const allStats = useMemo<AttendanceStats[]>(() => {
    const result: AttendanceStats[] = []
    const filteredSubjects = filters.subjectIds.length > 0
      ? subjects.filter((s) => filters.subjectIds.includes(s.id))
      : subjects

    for (const sub of filteredSubjects) {
      for (const ct of sub.class_types) {
        result.push(calculateClassTypeStats(ct, filteredRecords))
      }
    }
    return result
  }, [subjects, filteredRecords, filters.subjectIds])

  // All class types across subjects
  const allClassTypes = useMemo(
    () => subjects.flatMap((s) => s.class_types),
    [subjects]
  )

  const filteredSubjects = useMemo(
    () =>
      filters.subjectIds.length > 0
        ? subjects.filter((s) => filters.subjectIds.includes(s.id))
        : subjects,
    [subjects, filters.subjectIds]
  )

  const timeSeries = useMemo(
    () =>
      buildTimeSeriesData(
        filteredRecords,
        allClassTypes,
        filteredSubjects,
        filters.subjectIds.length > 0 ? filters.subjectIds : undefined
      ),
    [filteredRecords, allClassTypes, filteredSubjects, filters.subjectIds]
  )

  const comparison = useMemo(
    () => buildSubjectComparisonData(allStats, filteredSubjects),
    [allStats, filteredSubjects]
  )

  const classTypeBreakdown = useMemo(
    () => buildClassTypeBreakdown(filteredSubjects),
    [filteredSubjects]
  )

  // Heatmap always uses full records (not filtered by subject) for date range
  const heatmap = useMemo(() => buildHeatmapData(allRecords, 3), [allRecords])

  return {
    allRecords,
    filteredRecords,
    allStats,
    timeSeries,
    comparison,
    classTypeBreakdown,
    heatmap,
    loading,
    filters,
    setFilters,
    refresh,
  }
}
