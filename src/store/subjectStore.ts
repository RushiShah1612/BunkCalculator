import { create } from "zustand"
import type { Subject, AttendanceRecord } from "../types"

interface SubjectState {
  subjects: Subject[]
  attendanceRecords: AttendanceRecord[]
  loading: boolean
  setSubjects: (subjects: Subject[]) => void
  setAttendanceRecords: (records: AttendanceRecord[]) => void
  setLoading: (loading: boolean) => void
  addSubject: (subject: Subject) => void
  updateSubject: (subject: Subject) => void
  deleteSubject: (subjectId: string) => void
  addAttendanceRecord: (record: AttendanceRecord) => void
  updateAttendanceRecord: (record: AttendanceRecord) => void
  deleteAttendanceRecord: (recordId: string) => void
}

export const useSubjectStore = create<SubjectState>((set) => ({
  subjects: [],
  attendanceRecords: [],
  loading: false,
  setSubjects: (subjects) => set({ subjects }),
  setAttendanceRecords: (attendanceRecords) => set({ attendanceRecords }),
  setLoading: (loading) => set({ loading }),
  addSubject: (subject) => 
    set((state) => ({ subjects: [...state.subjects, subject] })),
  updateSubject: (updated) => 
    set((state) => ({
      subjects: state.subjects.map((s) => (s.id === updated.id ? updated : s)),
    })),
  deleteSubject: (subjectId) => 
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
