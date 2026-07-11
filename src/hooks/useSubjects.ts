import { useCallback } from "react"
import { useSubjectStore } from "../store/subjectStore"
import { useAuthStore } from "../store/authStore"
import { useToastStore } from "../store/toastStore"
import { supabase } from "../lib/supabase"
import type { Subject, ClassTypeConfig } from "../types"

export function useSubjects() {
  const {
    subjects,
    isLoading,
    error,
    setSubjects,
    addSubject,
    updateSubjectInStore,
    removeSubject,
    setLoading,
    setError,
  } = useSubjectStore()

  const { user } = useAuthStore()
  const { toast } = useToastStore()

  const fetchSubjects = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: selectError } = await supabase
        .from("subjects")
        .select(`
          *,
          class_types (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (selectError) throw selectError
      setSubjects(data as Subject[])
    } catch (err: unknown) {
      const errorMsg = err instanceof Error
        ? err.message
        : (err && typeof err === "object" && "message" in err)
          ? String((err as { message: string }).message)
          : String(err)
      console.error("Error fetching subjects:", errorMsg)
      setError(errorMsg)
      toast("Failed to load subjects: " + errorMsg, "error")
    } finally {
      setLoading(false)
    }
  }, [user, setLoading, setError, setSubjects, toast])

  const createSubject = useCallback(async (
    subjectData: Omit<Subject, "id" | "user_id" | "created_at" | "class_types"> & {
      class_types: Omit<ClassTypeConfig, "id" | "subject_id" | "created_at">[]
    }
  ) => {
    if (!user) throw new Error("User not authenticated")
    setLoading(true)
    setError(null)
    try {
      // 1. Insert Subject
      const { data: subjectRow, error: subjectError } = await supabase
        .from("subjects")
        .insert({
          user_id: user.id,
          name: subjectData.name,
          code: subjectData.code || null,
          color_tag: subjectData.color_tag,
          credits: subjectData.credits || null,
          semester: subjectData.semester || null,
          start_date: subjectData.start_date || null,
          min_attendance: subjectData.min_attendance,
        })
        .select()
        .single()

      if (subjectError) throw subjectError

      // 2. Insert Class Types in a Batch
      const classTypesPayload = subjectData.class_types.map((ct) => ({
        subject_id: subjectRow.id,
        name: ct.name,
        total_hours: ct.total_hours,
        hours_per_session: ct.hours_per_session,
        timetable_days: ct.timetable_days || [],
      }))

      const { data: classTypeRows, error: classTypeError } = await supabase
        .from("class_types")
        .insert(classTypesPayload)
        .select()

      if (classTypeError) throw classTypeError

      const completeSubject: Subject = {
        ...subjectRow,
        class_types: classTypeRows || [],
      }

      addSubject(completeSubject)
      toast("Subject created successfully!", "success")
      return completeSubject
    } catch (err: unknown) {
      const errorMsg = err instanceof Error
        ? err.message
        : (err && typeof err === "object" && "message" in err)
          ? String((err as { message: string }).message)
          : String(err)
      console.error("Error creating subject:", errorMsg)
      setError(errorMsg)
      toast("Failed to create subject: " + errorMsg, "error")
      throw err
    } finally {
      setLoading(false)
    }
  }, [user, setLoading, setError, addSubject, toast])

  const updateSubject = useCallback(async (
    id: string,
    subjectData: Omit<Subject, "id" | "user_id" | "created_at" | "class_types"> & {
      class_types: (Omit<ClassTypeConfig, "id" | "subject_id" | "created_at"> & { id?: string })[]
    }
  ) => {
    if (!user) throw new Error("User not authenticated")
    setLoading(true)
    setError(null)
    try {
      // 1. Update Subject metadata
      const { error: subjectError } = await supabase
        .from("subjects")
        .update({
          name: subjectData.name,
          code: subjectData.code || null,
          color_tag: subjectData.color_tag,
          credits: subjectData.credits || null,
          semester: subjectData.semester || null,
          start_date: subjectData.start_date || null,
          min_attendance: subjectData.min_attendance,
        })
        .eq("id", id)

      if (subjectError) throw subjectError

      // 2. Sync nested class types
      // Fetch currently stored class types in the database
      const { data: existingClassTypes, error: fetchClassError } = await supabase
        .from("class_types")
        .select("id")
        .eq("subject_id", id)

      if (fetchClassError) throw fetchClassError

      const existingIds = existingClassTypes.map((c) => c.id)
      const incomingIds = subjectData.class_types.map((c) => c.id).filter(Boolean) as string[]

      // Delete: existing in DB but missing in incoming
      const toDeleteIds = existingIds.filter((exId) => !incomingIds.includes(exId))
      if (toDeleteIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("class_types")
          .delete()
          .in("id", toDeleteIds)
        if (deleteError) throw deleteError
      }

      // Update & Insert
      for (const ct of subjectData.class_types) {
        if (ct.id) {
          // Update existing
          const { error: updateError } = await supabase
            .from("class_types")
            .update({
              name: ct.name,
              total_hours: ct.total_hours,
              hours_per_session: ct.hours_per_session,
              timetable_days: ct.timetable_days || [],
            })
            .eq("id", ct.id)
          if (updateError) throw updateError
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from("class_types")
            .insert({
              subject_id: id,
              name: ct.name,
              total_hours: ct.total_hours,
              hours_per_session: ct.hours_per_session,
              timetable_days: ct.timetable_days || [],
            })
          if (insertError) throw insertError
        }
      }

      // 3. Re-fetch final subject with its class types to keep store fully in sync
      const { data: updatedSubject, error: finalFetchError } = await supabase
        .from("subjects")
        .select(`
          *,
          class_types (*)
        `)
        .eq("id", id)
        .single()

      if (finalFetchError) throw finalFetchError

      updateSubjectInStore(updatedSubject as Subject)
      toast("Subject updated successfully!", "success")
      return updatedSubject as Subject
    } catch (err: unknown) {
      const errorMsg = err instanceof Error
        ? err.message
        : (err && typeof err === "object" && "message" in err)
          ? String((err as { message: string }).message)
          : String(err)
      console.error("Error updating subject:", errorMsg)
      setError(errorMsg)
      toast("Failed to update subject: " + errorMsg, "error")
      throw err
    } finally {
      setLoading(false)
    }
  }, [user, setLoading, setError, updateSubjectInStore, toast])

  const deleteSubject = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error: deleteError } = await supabase
        .from("subjects")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      removeSubject(id)
      toast("Subject deleted successfully!", "success")
    } catch (err: unknown) {
      const errorMsg = err instanceof Error
        ? err.message
        : (err && typeof err === "object" && "message" in err)
          ? String((err as { message: string }).message)
          : String(err)
      console.error("Error deleting subject:", errorMsg)
      setError(errorMsg)
      toast("Failed to delete subject: " + errorMsg, "error")
      throw err
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, removeSubject, toast])

  return {
    subjects,
    loading: isLoading,
    error,
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
  }
}
