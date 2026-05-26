import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "../lib/supabase"
import { useSubjectStore } from "../store/subjectStore"
import { useAuthStore } from "../store/authStore"
import { useToastStore } from "../store/toastStore"
import { calculateClassTypeStats } from "../lib/calculations"
import type { AttendanceRecord, AttendanceStats, Subject } from "../types"

export interface SubjectDetailData {
  subject: Subject | null
  records: AttendanceRecord[]
  statsPerType: AttendanceStats[]
  loading: boolean
  error: string | null
  refresh: () => void
  updateMinAttendance: (classTypeId: string, value: number) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
  upsertRecord: (payload: {
    class_type_id: string
    date: string
    status: AttendanceRecord["status"]
    notes?: string
  }) => Promise<void>
}

export function useSubjectDetail(subjectId: string): SubjectDetailData {
  const { subjects, updateSubjectInStore } = useSubjectStore()
  const { user } = useAuthStore()
  const { toast } = useToastStore()

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  // Pull subject from store (already fetched by SubjectsPage or dashboard)
  const subject = useMemo(
    () => subjects.find((s) => s.id === subjectId) ?? null,
    [subjects, subjectId]
  )

  // Fetch all records for every class type of this subject
  const fetchRecords = useCallback(async () => {
    if (!user || !subjectId) return
    setLoading(true)
    setError(null)
    try {
      // Fetch subject fresh from DB if not in store yet
      if (!subject) {
        const { data: subjectData, error: subjectErr } = await supabase
          .from("subjects")
          .select("*, class_types(*)")
          .eq("id", subjectId)
          .eq("user_id", user.id)
          .single()

        if (subjectErr) throw subjectErr
        if (subjectData) updateSubjectInStore(subjectData as Subject)
      }

      // Fetch records for this subject's class types
      const { data, error: recErr } = await supabase
        .from("attendance_records")
        .select("*, class_types!inner(subject_id, subjects!inner(user_id))")
        .eq("class_types.subject_id", subjectId)
        .eq("class_types.subjects.user_id", user.id)
        .order("date", { ascending: false })

      if (recErr) throw recErr
      setRecords((data as AttendanceRecord[]) ?? [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      console.error("useSubjectDetail fetchRecords:", msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [user, subjectId, subject, updateSubjectInStore])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchRecords, refreshToken])

  const refresh = useCallback(() => setRefreshToken((t) => t + 1), [])

  // Compute stats per class type
  const statsPerType = useMemo<AttendanceStats[]>(() => {
    if (!subject) return []
    return subject.class_types.map((ct) => calculateClassTypeStats(ct, records, subject.min_attendance))
  }, [subject, records])

  // Quick-update min_attendance for the subject
  const updateMinAttendance = useCallback(
    async (classTypeId: string, value: number) => {
      void classTypeId
      if (!subject) return
      try {
        const { error: err } = await supabase
          .from("subjects")
          .update({ min_attendance: value })
          .eq("id", subject.id)

        if (err) throw err

        // Update subject in store
        updateSubjectInStore({ ...subject, min_attendance: value })
        toast("Required % updated!", "success")
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Update failed"
        toast(msg, "error")
      }
    },
    [subject, updateSubjectInStore, toast]
  )

  // Delete a single record
  const deleteRecord = useCallback(
    async (id: string) => {
      try {
        const { error: err } = await supabase
          .from("attendance_records")
          .delete()
          .eq("id", id)

        if (err) throw err
        setRecords((prev) => prev.filter((r) => r.id !== id))
        toast("Record deleted.", "success")
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Delete failed"
        toast(msg, "error")
      }
    },
    [toast]
  )

  // Upsert a single record (used by inline edit / calendar click)
  const upsertRecord = useCallback(
    async (payload: {
      class_type_id: string
      date: string
      status: AttendanceRecord["status"]
      notes?: string
    }) => {
      if (!user) return
      try {
        const { data, error: err } = await supabase
          .from("attendance_records")
          .upsert(
            { ...payload, user_id: user.id, notes: payload.notes ?? null },
            { onConflict: "class_type_id,date" }
          )
          .select()

        if (err) throw err
        if (data && data.length > 0) {
          const upserted = data[0] as AttendanceRecord
          setRecords((prev) => {
            const idx = prev.findIndex((r) => r.id === upserted.id)
            if (idx >= 0) {
              const copy = [...prev]
              copy[idx] = upserted
              return copy
            }
            return [upserted, ...prev]
          })
        }
        toast("Record saved!", "success")
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Save failed"
        toast(msg, "error")
      }
    },
    [user, toast]
  )

  return {
    subject,
    records,
    statsPerType,
    loading,
    error,
    refresh,
    updateMinAttendance,
    deleteRecord,
    upsertRecord,
  }
}
