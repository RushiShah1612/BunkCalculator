import { create } from "zustand"
import type { Subject, AttendanceRecord } from "../types"

interface SubjectState {
  subjects: Subject[]
  activeSubjects: Subject[]
  attendanceRecords: AttendanceRecord[]
  isLoading: boolean
  error: string | null
  setSubjects: (subjects: Subject[]) => void
  setAttendanceRecords: (records: AttendanceRecord[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  addSubject: (subject: Subject) => void
  updateSubjectInStore: (subject: Subject) => void
  removeSubject: (subjectId: string) => void
  addAttendanceRecord: (record: AttendanceRecord) => void
  updateAttendanceRecord: (record: AttendanceRecord) => void
  deleteAttendanceRecord: (recordId: string) => void
}

export const useSubjectStore = create<SubjectState>((set) => ({
  subjects: [],
  activeSubjects: [],
  attendanceRecords: [],
  isLoading: false,
  error: null,
  setSubjects: (subjects) => set({ subjects, activeSubjects: subjects.filter(s => !s.is_archived) }),
  setAttendanceRecords: (attendanceRecords) => set({ attendanceRecords }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addSubject: (subject) =>
    set((state) => {
      const newSubjects = [subject, ...state.subjects]
      return { subjects: newSubjects, activeSubjects: newSubjects.filter(s => !s.is_archived) }
    }),
  updateSubjectInStore: (updated) =>
    set((state) => {
      const newSubjects = state.subjects.map((s) => (s.id === updated.id ? updated : s))
      return { subjects: newSubjects, activeSubjects: newSubjects.filter(s => !s.is_archived) }
    }),
  removeSubject: (subjectId) =>
    set((state) => {
      const newSubjects = state.subjects.filter((s) => s.id !== subjectId)
      return { subjects: newSubjects, activeSubjects: newSubjects.filter(s => !s.is_archived) }
    }),
  addAttendanceRecord: (record) =>
    set((state) => ({ attendanceRecords: [...state.attendanceRecords, record] })),
  updateAttendanceRecord: (updated) =>
    set((state) => ({
      attendanceRecords: state.attendanceRecords.map((r) =>
        r.id === updated.id ? updated : r
      ),
    })),
  deleteAttendanceRecord: (recordId) =>
    set((state) => ({
      attendanceRecords: state.attendanceRecords.filter((r) => r.id !== recordId),
    })),
}))
