import { create } from "zustand"
import type { Subject, AttendanceRecord } from "../types"

interface SubjectState {
  subjects: Subject[]
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
  attendanceRecords: [],
  isLoading: false,
  error: null,
  setSubjects: (subjects) => set({ subjects }),
  setAttendanceRecords: (attendanceRecords) => set({ attendanceRecords }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addSubject: (subject) =>
    set((state) => ({ subjects: [subject, ...state.subjects] })),
  updateSubjectInStore: (updated) =>
    set((state) => ({
      subjects: state.subjects.map((s) => (s.id === updated.id ? updated : s)),
    })),
  removeSubject: (subjectId) =>
    set((state) => ({
      subjects: state.subjects.filter((s) => s.id !== subjectId),
    })),
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
