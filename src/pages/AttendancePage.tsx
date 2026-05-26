import { useState, useEffect, useCallback, useMemo } from "react"
import { PageWrapper } from "../components/layout/PageWrapper"
import { StatusBadge } from "../components/shared/StatusBadge"
import { ConfirmDialog } from "../components/shared/ConfirmDialog"
import { Button } from "../components/ui/button"
import { useSubjects } from "../hooks/useSubjects"
import { useAttendance } from "../hooks/useAttendance"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  Trash2,
  MessageSquare,
  Plus,
  X,
  CalendarDays,
  ClipboardList,
  Filter,
} from "lucide-react"
import type { AttendanceStatus, AttendanceRecord, Subject } from "../types"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getDotColor(statuses: AttendanceStatus[]): string {
  if (!statuses || statuses.length === 0) return ""
  const meaningfulStatuses = statuses.filter(
    (s) => s === "PRESENT" || s === "ABSENT"
  )
  if (meaningfulStatuses.length === 0) return "bg-gray-400"
  if (meaningfulStatuses.every((s) => s === "PRESENT")) return "bg-green-500"
  if (meaningfulStatuses.some((s) => s === "ABSENT")) return "bg-red-500"
  return "bg-gray-400"
}

const STATUS_OPTIONS: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "CANCELLED",
  "HOLIDAY",
]

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  CANCELLED: "Cancelled",
  HOLIDAY: "Holiday",
}

const STATUS_ACTIVE_CLASS: Record<AttendanceStatus, string> = {
  PRESENT:
    "bg-green-500 text-white border-green-500 shadow-md shadow-green-500/20",
  ABSENT: "bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20",
  CANCELLED:
    "bg-gray-500 text-white border-gray-500 shadow-md shadow-gray-500/20",
  HOLIDAY:
    "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20",
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ─── Mini Calendar ────────────────────────────────────────────────────────────

interface MiniCalendarProps {
  selectedDate: string
  onSelectDate: (date: string) => void
  monthSummary: Record<string, AttendanceStatus[]>
  onMonthChange: (year: number, month: number) => void
}

function MiniCalendar({
  selectedDate,
  onSelectDate,
  monthSummary,
  onMonthChange,
}: MiniCalendarProps) {
  const today = toLocalDateStr(new Date())
  const [calMonth, setCalMonth] = useState(() => {
    const [y, m] = selectedDate.split("-").map(Number)
    return { year: y, month: m }
  })

  const { year, month } = calMonth

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1)
    const next = { year: d.getFullYear(), month: d.getMonth() + 1 }
    setCalMonth(next)
    onMonthChange(next.year, next.month)
  }

  const nextMonth = () => {
    const d = new Date(year, month, 1)
    const next = { year: d.getFullYear(), month: d.getMonth() + 1 }
    setCalMonth(next)
    onMonthChange(next.year, next.month)
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="bg-card border border-border rounded-3xl p-5 select-none">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-foreground">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === today
          const dotColor = getDotColor(monthSummary[dateStr] ?? [])

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`relative flex flex-col items-center justify-center h-9 w-full rounded-xl text-xs font-medium transition-all
                ${isSelected
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : isToday
                  ? "bg-primary/10 text-primary font-bold"
                  : "hover:bg-muted text-foreground"
                }`}
            >
              {day}
              {dotColor && !isSelected && (
                <span
                  className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${dotColor}`}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/60">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          All present
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          Has absent
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
          No class
        </div>
      </div>
    </div>
  )
}

// ─── Mark Form Row ────────────────────────────────────────────────────────────

interface MarkRowProps {
  label: string
  status: AttendanceStatus | null
  notes: string
  onStatusChange: (s: AttendanceStatus | null) => void
  onNotesChange: (n: string) => void
}

function MarkRow({ label, status, notes, onStatusChange, onNotesChange }: MarkRowProps) {
  const [showNotes, setShowNotes] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">
          {label}
        </span>
        <div className="flex flex-wrap gap-1.5 flex-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(status === s ? null : s)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                status === s
                  ? STATUS_ACTIVE_CLASS[s]
                  : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNotes((p) => !p)}
          title="Add notes"
          className={`p-1.5 rounded-lg transition-colors ${
            showNotes || notes
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
      </div>
      {(showNotes || notes) && (
        <div className="pl-24 animate-in fade-in duration-150">
          <input
            type="text"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add a note..."
            className="w-full text-xs px-3 py-1.5 rounded-xl border border-border bg-background/60 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
      )}
    </div>
  )
}

// ─── Subject Block ─────────────────────────────────────────────────────────────

interface SubjectBlockProps {
  subject: Subject
  entries: Record<string, { status: AttendanceStatus | null; notes: string }>
  onStatusChange: (ctId: string, s: AttendanceStatus | null) => void
  onNotesChange: (ctId: string, n: string) => void
}

function SubjectBlock({
  subject,
  entries,
  onStatusChange,
  onNotesChange,
}: SubjectBlockProps) {
  return (
    <div
      className="rounded-2xl border border-border/80 bg-card/40 overflow-hidden"
      style={{ borderLeftColor: subject.color_tag, borderLeftWidth: 4 }}
    >
      {/* Subject header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-border/40">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: subject.color_tag }}
        />
        <h4 className="font-bold text-sm text-foreground">{subject.name}</h4>
        {subject.code && (
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {subject.code}
          </span>
        )}
      </div>

      {/* Class type rows */}
      <div className="px-4 py-3 space-y-3">
        {subject.class_types.map((ct) => {
          const entry = entries[ct.id] ?? { status: null, notes: "" }
          return (
            <MarkRow
              key={ct.id}
              label={ct.name}
              status={entry.status}
              notes={entry.notes}
              onStatusChange={(s) => onStatusChange(ct.id, s)}
              onNotesChange={(n) => onNotesChange(ct.id, n)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── History Tab ───────────────────────────────────────────────────────────────

interface HistoryTabProps {
  subjects: Subject[]
}

function HistoryTab({ subjects }: HistoryTabProps) {
  const { fetchAllRecords, deleteRecord } = useAttendance()
  const [records, setRecords] = useState<(AttendanceRecord & { _subjectName?: string; _ctName?: string; _colorTag?: string })[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  // Filters
  const [filterSubject, setFilterSubject] = useState("")
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | "">("")
  const [filterStart, setFilterStart] = useState("")
  const [filterEnd, setFilterEnd] = useState("")

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      fetchAllRecords()
        .then((data) => {
          // Enrich records with subject/ct names
          const enriched = data.map((r) => {
            let subjectName = ""
            let ctName = ""
            let colorTag = ""
            for (const sub of subjects) {
              const ct = sub.class_types.find((c) => c.id === r.class_type_id)
              if (ct) {
                subjectName = sub.name
                ctName = ct.name
                colorTag = sub.color_tag
                break
              }
            }
            return { ...r, _subjectName: subjectName, _ctName: ctName, _colorTag: colorTag }
          })
          setRecords(enriched)
        })
        .finally(() => setLoading(false))
    }, 0)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterSubject && !r._subjectName?.toLowerCase().includes(filterSubject.toLowerCase()))
        return false
      if (filterStatus && r.status !== filterStatus) return false
      if (filterStart && r.date < filterStart) return false
      if (filterEnd && r.date > filterEnd) return false
      return true
    })
  }, [records, filterSubject, filterStatus, filterStart, filterEnd])

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleDelete = async (id: string) => {
    await deleteRecord(id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          Filters
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Subject name..."
            value={filterSubject}
            onChange={(e) => { setFilterSubject(e.target.value); setPage(0) }}
            className="px-3 py-2 rounded-xl border border-border bg-background/60 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as AttendanceStatus | ""); setPage(0) }}
            className="px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterStart}
            onChange={(e) => { setFilterStart(e.target.value); setPage(0) }}
            className="px-3 py-2 rounded-xl border border-border bg-background/60 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="date"
            value={filterEnd}
            onChange={(e) => { setFilterEnd(e.target.value); setPage(0) }}
            className="px-3 py-2 rounded-xl border border-border bg-background/60 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        {(filterSubject || filterStatus || filterStart || filterEnd) && (
          <button
            onClick={() => { setFilterSubject(""); setFilterStatus(""); setFilterStart(""); setFilterEnd(""); setPage(0) }}
            className="mt-2 text-[10px] text-primary hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">No records found</p>
          <p className="text-xs mt-1">Try adjusting your filters or log some attendance</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Class Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Notes</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(r.date + "T12:00:00").toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {r._colorTag && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: r._colorTag }}
                          />
                        )}
                        {r._subjectName || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r._ctName || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[160px] truncate">
                      {r.notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            id: r.id,
                            label: `${r._subjectName} ${r._ctName} (${r.date})`,
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {filtered.length} records · Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl h-7 text-xs"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl h-7 text-xs"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Record"
        description={`Are you sure you want to delete this attendance record? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ─── FAB Bottom Sheet ──────────────────────────────────────────────────────────

interface QuickMarkSheetProps {
  isOpen: boolean
  onClose: () => void
  subjects: Subject[]
  onSave: (date: string, entries: Record<string, { status: AttendanceStatus | null; notes: string }>) => Promise<void>
  saving: boolean
}

function QuickMarkSheet({ isOpen, onClose, subjects, onSave, saving }: QuickMarkSheetProps) {
  const todayStr = toLocalDateStr(new Date())
  const [date, setDate] = useState(todayStr)
  const [entries, setEntries] = useState<Record<string, { status: AttendanceStatus | null; notes: string }>>({})

  const updateStatus = (ctId: string, s: AttendanceStatus | null) =>
    setEntries((p) => ({ ...p, [ctId]: { ...(p[ctId] ?? { notes: "" }), status: s } }))

  const updateNotes = (ctId: string, n: string) =>
    setEntries((p) => ({ ...p, [ctId]: { ...(p[ctId] ?? { status: null }), notes: n } }))

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-foreground">Quick Log</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background/60 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {subjects.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Add subjects first to log attendance.
            </p>
          )}
          {subjects.map((sub) => (
            <SubjectBlock
              key={sub.id}
              subject={sub}
              entries={entries}
              onStatusChange={updateStatus}
              onNotesChange={updateNotes}
            />
          ))}
          <Button
            className="w-full rounded-xl"
            disabled={saving}
            onClick={() => onSave(date, entries).then(onClose)}
          >
            {saving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const today = toLocalDateStr(new Date())
  const [activeTab, setActiveTab] = useState<"mark" | "history">("mark")
  const [selectedDate, setSelectedDate] = useState(today)
  const [monthSummary, setMonthSummary] = useState<Record<string, AttendanceStatus[]>>({})
  const [entries, setEntries] = useState<Record<string, { status: AttendanceStatus | null; notes: string }>>({})
  const [saving, setSaving] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)

  useEffect(() => {
    document.title = "Log Attendance | RollCall"
  }, [])

  const { subjects, fetchSubjects } = useSubjects()
  const {
    fetchRecordsByDate,
    fetchMonthSummary,
    upsertAttendance,
  } = useAttendance()

  // Load subjects on mount
  useEffect(() => {
    fetchSubjects()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load month summary for calendar dots
  const loadMonthSummary = useCallback(
    async (year: number, month: number) => {
      const summary = await fetchMonthSummary(year, month)
      setMonthSummary(summary)
    },
    [fetchMonthSummary]
  )

  useEffect(() => {
    const [y, m] = selectedDate.split("-").map(Number)
    const timer = setTimeout(() => {
      loadMonthSummary(y, m)
    }, 0)
    return () => clearTimeout(timer)
  }, [selectedDate, loadMonthSummary])

  // When date changes, load that day's records into form state
  const loadDayRecords = useCallback(
    async (dateStr: string) => {
      const records = await fetchRecordsByDate(dateStr)
      const newEntries: Record<string, { status: AttendanceStatus | null; notes: string }> = {}
      for (const r of records) {
        newEntries[r.class_type_id] = {
          status: r.status,
          notes: r.notes ?? "",
        }
      }
      setEntries(newEntries)
    },
    [fetchRecordsByDate]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDayRecords(selectedDate)
    }, 0)
    return () => clearTimeout(timer)
  }, [selectedDate, loadDayRecords])

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
  }

  const updateStatus = (ctId: string, s: AttendanceStatus | null) =>
    setEntries((p) => ({ ...p, [ctId]: { ...(p[ctId] ?? { notes: "" }), status: s } }))

  const updateNotes = (ctId: string, n: string) =>
    setEntries((p) => ({ ...p, [ctId]: { ...(p[ctId] ?? { status: null }), notes: n } }))

  const handleMarkAllPresent = () => {
    const newEntries: typeof entries = {}
    for (const sub of subjects) {
      for (const ct of sub.class_types) {
        newEntries[ct.id] = { status: "PRESENT", notes: entries[ct.id]?.notes ?? "" }
      }
    }
    setEntries(newEntries)
  }

  const handleClearAll = () => {
    const newEntries: typeof entries = {}
    for (const sub of subjects) {
      for (const ct of sub.class_types) {
        newEntries[ct.id] = { status: null, notes: "" }
      }
    }
    setEntries(newEntries)
  }

  const handleSave = async (
    dateStr: string = selectedDate,
    entriesToSave: typeof entries = entries
  ) => {
    setSaving(true)
    try {
      const payload: Parameters<typeof upsertAttendance>[0] = []
      for (const [ctId, entry] of Object.entries(entriesToSave)) {
        if (entry.status) {
          payload.push({
            class_type_id: ctId,
            date: dateStr,
            status: entry.status,
            notes: entry.notes || undefined,
          })
        }
      }
      if (payload.length === 0) return
      await upsertAttendance(payload)
      // Refresh month summary dots
      const [y, m] = dateStr.split("-").map(Number)
      loadMonthSummary(y, m)
    } finally {
      setSaving(false)
    }
  }

  const allCtCount = subjects.reduce((a, s) => a + s.class_types.length, 0)
  const markedCount = Object.values(entries).filter((e) => e.status).length

  return (
    <PageWrapper title="Log Attendance">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-2xl p-1 w-fit mb-6">
        <button
          onClick={() => setActiveTab("mark")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "mark"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Mark Attendance
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "history"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          History
        </button>
      </div>

      {activeTab === "history" ? (
        <HistoryTab subjects={subjects} />
      ) : (
        <>
          {/* Two-panel layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left panel – Calendar */}
            <div className="lg:w-72 flex-shrink-0">
              <MiniCalendar
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                monthSummary={monthSummary}
                onMonthChange={loadMonthSummary}
              />
            </div>

            {/* Right panel – Form */}
            <div className="flex-1 min-w-0">
              {/* Date Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {formatDisplayDate(selectedDate)}
                  </h2>
                  {allCtCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {markedCount} of {allCtCount} class types marked
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDate(today)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      selectedDate === today
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date(selectedDate + "T12:00:00")
                      d.setDate(d.getDate() - 1)
                      setSelectedDate(toLocalDateStr(d))
                    }}
                    className="p-1.5 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date(selectedDate + "T12:00:00")
                      d.setDate(d.getDate() + 1)
                      setSelectedDate(toLocalDateStr(d))
                    }}
                    className="p-1.5 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subjects form */}
              {subjects.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl flex flex-col items-center justify-center py-20 text-center">
                  <CalendarDays className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="font-semibold text-foreground mb-1">No subjects yet</p>
                  <p className="text-xs text-muted-foreground">
                    Add subjects from the Subjects page to start logging attendance.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subjects.map((sub) => (
                    <SubjectBlock
                      key={sub.id}
                      subject={sub}
                      entries={entries}
                      onStatusChange={updateStatus}
                      onNotesChange={updateNotes}
                    />
                  ))}

                  {/* Bottom actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      onClick={() => handleSave()}
                      disabled={saving || markedCount === 0}
                      className="rounded-xl shadow-lg shadow-primary/10 flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Save Attendance
                        </>
                      )}
                    </Button>
                    <button
                      onClick={handleMarkAllPresent}
                      className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      Mark All Present
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* FAB – Mobile Quick Log */}
      <button
        onClick={() => setFabOpen(true)}
        className="fixed bottom-20 right-5 sm:hidden z-40 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
        aria-label="Quick log attendance"
      >
        <Plus className="w-6 h-6" />
      </button>

      <QuickMarkSheet
        isOpen={fabOpen}
        onClose={() => setFabOpen(false)}
        subjects={subjects}
        onSave={handleSave}
        saving={saving}
      />
    </PageWrapper>
  )
}
