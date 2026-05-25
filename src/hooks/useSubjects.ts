import { useSubjectStore } from "../store/subjectStore"
import type { Subject } from "../types"

export function useSubjects() {
  const { subjects, loading, addSubject, updateSubject, deleteSubject, setLoading } = useSubjectStore()

  const fetchSubjects = async () => {
    setLoading(true)
    try {
      // Mock fetch in prompt 1
    } finally {
      setLoading(false)
    }
  }

  const createSubject = async (subjectData: Omit<Subject, "id" | "user_id" | "created_at" | "class_types"> & { class_types: any[] }) => {
    const newSubject: Subject = {
      id: Math.random().toString(36).substring(7),
      user_id: "mock-user-id",
      created_at: new Date().toISOString(),
      name: subjectData.name,
      code: subjectData.code || null,
      color_tag: subjectData.color_tag,
      credits: subjectData.credits || null,
      semester: subjectData.semester || null,
      class_types: subjectData.class_types.map(ct => ({
        id: Math.random().toString(36).substring(7),
        subject_id: "", // filled below or reference
        name: ct.name,
        total_hours: ct.total_hours,
        hours_per_session: ct.hours_per_session,
        min_attendance: ct.min_attendance ?? 75,
        created_at: new Date().toISOString()
      }))
    }
    newSubject.class_types.forEach(ct => ct.subject_id = newSubject.id)
    addSubject(newSubject)
    return newSubject
  }

  return {
    subjects,
    loading,
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
  }
}
