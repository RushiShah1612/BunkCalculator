import { useCallback } from "react"
import { supabase } from "../lib/supabase"
import { useAuthStore } from "../store/authStore"
import { useToastStore } from "../store/toastStore"
import { useSubjectStore } from "../store/subjectStore"
import type { AttendanceRecord, AttendanceStatus } from "../types"

/**
 * useAttendance – complete Supabase-backed attendance operations.
 * All queries are scoped to the authenticated user via RLS policies.
 */
export function useAttendance() {
  const { user } = useAuthStore()
  const { toast } = useToastStore()
  const {
    attendanceRecords,
    setAttendanceRecords,
    addAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    isLoading: loading,
    setLoading,
  } = useSubjectStore()

  // ─── fetchRecordsByDate ───────────────────────────────────────────────────

  /**
   * Fetch all attendance records for the current user on a specific date.
   * @param date ISO date string "YYYY-MM-DD"
   */
  const fetchRecordsByDate = useCallback(
    async (date: string): Promise<AttendanceRecord[]> => {
      if (!user) return []
      try {
        const { data, error } = await supabase
          .from("attendance_records")
          .select("*, class_types!inner(subject_id, subjects!inner(user_id))")
          .eq("date", date)
          .eq("class_types.subjects.user_id", user.id)

        if (error) throw error
        return (data as AttendanceRecord[]) ?? []
      } catch (err: unknown) {
        console.error("fetchRecordsByDate error:", err)
        return []
      }
    },
    [user]
  )

  // ─── fetchRecordsByDateRange ──────────────────────────────────────────────

  /**
   * Fetch all records within an inclusive date range (for calendar month view).
   * @param startDate "YYYY-MM-DD"
   * @param endDate   "YYYY-MM-DD"
   */
  const fetchRecordsByDateRange = useCallback(
    async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
      if (!user) return []
      try {
        const { data, error } = await supabase
          .from("attendance_records")
          .select("*, class_types!inner(subject_id, subjects!inner(user_id))")
          .gte("date", startDate)
          .lte("date", endDate)
          .eq("class_types.subjects.user_id", user.id)
          .order("date", { ascending: true })

        if (error) throw error
        return (data as AttendanceRecord[]) ?? []
      } catch (err: unknown) {
        console.error("fetchRecordsByDateRange error:", err)
        return []
      }
    },
    [user]
  )

  // ─── fetchRecordsByClassType ──────────────────────────────────────────────

  /**
   * Fetch all records for a given class type (used for statistics calculation).
   */
  const fetchRecordsByClassType = useCallback(
    async (classTypeId: string): Promise<AttendanceRecord[]> => {
      if (!user) return []
      try {
        const { data, error } = await supabase
          .from("attendance_records")
          .select("*")
          .eq("class_type_id", classTypeId)
          .order("date", { ascending: false })

        if (error) throw error
        const records = (data as AttendanceRecord[]) ?? []
        setAttendanceRecords(records)
        return records
      } catch (err: unknown) {
        console.error("fetchRecordsByClassType error:", err)
        return []
      }
    },
    [user, setAttendanceRecords]
  )

  // ─── upsertAttendance ─────────────────────────────────────────────────────

  /**
   * Batch upsert attendance records (insert or update based on class_type_id + date).
   */
  const upsertAttendance = useCallback(
    async (
      records: {
        class_type_id: string
        date: string
        status: AttendanceStatus
        notes?: string
      }[]
    ): Promise<void> => {
      if (!user) throw new Error("Not authenticated")
      setLoading(true)
      try {
        const payload = records.map((r) => ({
          class_type_id: r.class_type_id,
          date: r.date,
          status: r.status,
          notes: r.notes ?? null,
          // user_id is set in the DB via RLS trigger / default, but Supabase
          // RLS INSERT policy verifies via auth.uid() — we pass it explicitly
          // so the column default doesn't need a trigger.
          user_id: user.id,
        }))

        const { data, error } = await supabase
          .from("attendance_records")
          .upsert(payload, {
            onConflict: "class_type_id,date",
            ignoreDuplicates: false,
          })
          .select()

        if (error) throw error

        // Sync updated records into the store
        if (data) {
          for (const row of data as AttendanceRecord[]) {
            const existing = attendanceRecords.find((r) => r.id === row.id)
            if (existing) {
              updateAttendanceRecord(row)
            } else {
              addAttendanceRecord(row)
            }
          }
        }

        toast("Attendance saved!", "success")
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        console.error("upsertAttendance error:", msg)
        toast("Failed to save: " + msg, "error")
        throw err
      } finally {
        setLoading(false)
      }
    },
    [user, attendanceRecords, addAttendanceRecord, updateAttendanceRecord, setLoading, toast]
  )

  // ─── deleteRecord ─────────────────────────────────────────────────────────

  /**
   * Delete a single attendance record by its UUID.
   */
  const deleteRecord = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true)
      try {
        const { error } = await supabase
          .from("attendance_records")
          .delete()
          .eq("id", id)

        if (error) throw error
        deleteAttendanceRecord(id)
        toast("Record deleted.", "success")
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        toast("Delete failed: " + msg, "error")
        throw err
      } finally {
        setLoading(false)
      }
    },
    [deleteAttendanceRecord, setLoading, toast]
  )

  // ─── fetchMonthSummary ────────────────────────────────────────────────────

  /**
   * Returns a map of { "YYYY-MM-DD": AttendanceStatus[] } for calendar dot rendering.
   * Only records belonging to the current user are included.
   */
  const fetchMonthSummary = useCallback(
    async (
      year: number,
      month: number // 1-indexed
    ): Promise<Record<string, AttendanceStatus[]>> => {
      if (!user) return {}
      try {
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`
        const lastDay = new Date(year, month, 0).getDate()
        const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`

        const { data, error } = await supabase
          .from("attendance_records")
          .select("date, status, class_types!inner(subjects!inner(user_id))")
          .gte("date", startDate)
          .lte("date", endDate)
          .eq("class_types.subjects.user_id", user.id)

        if (error) throw error

        const summary: Record<string, AttendanceStatus[]> = {}
        for (const row of (data ?? []) as { date: string; status: AttendanceStatus }[]) {
          if (!summary[row.date]) summary[row.date] = []
          summary[row.date].push(row.status)
        }
        return summary
      } catch (err: unknown) {
        console.error("fetchMonthSummary error:", err)
        return {}
      }
    },
    [user]
  )

  // ─── fetchAllRecords ──────────────────────────────────────────────────────

  /**
   * Fetch all records for the current user (used by the history tab).
   */
  const fetchAllRecords = useCallback(
    async (): Promise<AttendanceRecord[]> => {
      if (!user) return []
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("attendance_records")
          .select("*, class_types!inner(name, subject_id, subjects!inner(name, user_id, color_tag))")
          .eq("class_types.subjects.user_id", user.id)
          .order("date", { ascending: false })

        if (error) throw error
        const records = (data ?? []) as AttendanceRecord[]
        setAttendanceRecords(records)
        return records
      } catch (err: unknown) {
        console.error("fetchAllRecords error:", err)
        return []
      } finally {
        setLoading(false)
      }
    },
    [user, setAttendanceRecords, setLoading]
  )

  return {
    attendanceRecords,
    loading,
    fetchRecordsByDate,
    fetchRecordsByDateRange,
    fetchRecordsByClassType,
    upsertAttendance,
    deleteRecord,
    fetchMonthSummary,
    fetchAllRecords,
    // Legacy compat
    updateAttendanceRecord,
    deleteAttendanceRecord,
  }
}
