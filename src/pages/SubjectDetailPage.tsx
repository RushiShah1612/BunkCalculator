import { useState, useMemo, useCallback, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { PageWrapper } from "../components/layout/PageWrapper"
import { Button } from "../components/ui/button"
import { SubjectModal } from "../components/shared/SubjectModal"
import { ConfirmDialog } from "../components/shared/ConfirmDialog"
import { useSubjectDetail } from "../hooks/useSubjectDetail"
import { useSubjects } from "../hooks/useSubjects"
import { simulateAttendance, calculateAttendanceStatus } from "../lib/calculations"
import {
  ArrowLeft,
  Edit3,
  Trash2,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
  Clock,
  Calendar,
} from "lucide-react"
import type { AttendanceRecord, AttendanceStats, AttendanceStatus, Subject } from "../types"

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PRESENT: {
    label: "Present",
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    dot: "bg-green-500",
  },
  ABSENT: {
    label: "Absent",
    bg: "bg-red-500/10",
    text: "text-red-500",
    dot: "bg-red-500",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-gray-400",
  },
  HOLIDAY: {
    label: "Holiday",
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    dot: "bg-blue-500",
  },
}

function statusIcon(s: "safe" | "warning" | "danger") {
  if (s === "safe") return <CheckCircle2 className="w-4 h-4 text-green-500" />
  if (s === "warning") return <AlertTriangle className="w-4 h-4 text-yellow-500" />
  return <XCircle className="w-4 h-4 text-red-500" />
}

function statusColor(s: "safe" | "warning" | "danger") {
  if (s === "safe") return "text-green-600 dark:text-green-400"
  if (s === "warning") return "text-yellow-600 dark:text-yellow-400"
  return "text-red-500"
}

function barColor(s: "safe" | "warning" | "danger") {
  if (s === "safe") return "bg-green-500"
  if (s === "warning") return "bg-yellow-500"
  return "bg-red-500"
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

// ─── Bunk Simulator ─────────────────────────────────────────────────────────

interface BunkSimulatorProps {
  stats: AttendanceStats
}

function BunkSimulator({ stats }: BunkSimulatorProps) {
  const [attendMore, setAttendMore] = useState(0)
  const [skipMore, setSkipMore] = useState(0)

  const remainingSessions = useMemo(() => {
    const totalSessions = Math.round(stats.totalHours / stats.hoursPerSession)
    const heldSessions = Math.round(stats.hoursHeld / stats.hoursPerSession)
    return Math.max(0, totalSessions - heldSessions)
  }, [stats])

  const attendResult = useMemo(() => {
    return simulateAttendance(
      stats.hoursPresent,
      stats.hoursHeld,
      stats.totalHours,
      stats.minAttendance,
      attendMore,
      0,
      stats.hoursPerSession
    )
  }, [stats, attendMore])

  const skipResult = useMemo(() => {
    return simulateAttendance(
      stats.hoursPresent,
      stats.hoursHeld,
      stats.totalHours,
      stats.minAttendance,
      0,
      skipMore,
      stats.hoursPerSession
    )
  }, [stats, skipMore])

  // Combined scenario
  const combinedResult = useMemo(() => {
    return simulateAttendance(
      stats.hoursPresent,
      stats.hoursHeld,
      stats.totalHours,
      stats.minAttendance,
      attendMore,
      skipMore,
      stats.hoursPerSession
    )
  }, [stats, attendMore, skipMore])

  const barPct = Math.min(100, combinedResult.projectedPercentage)
  const minPct = stats.minAttendance
  const dangerZone = combinedResult.status === "danger"

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        <h4 className="font-bold text-foreground">What-If Simulator</h4>
      </div>

      {/* Input row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Attend more */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            If I attend
          </label>
          <div className="flex items-center gap-2">
            <button
              className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-lg font-bold leading-none transition-colors"
              onClick={() => setAttendMore((v) => Math.max(0, v - 1))}
            >
              −
            </button>
            <span className="text-lg font-bold text-foreground w-8 text-center">{attendMore}</span>
            <button
              className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-lg font-bold leading-none transition-colors"
              onClick={() => setAttendMore((v) => Math.min(remainingSessions + 20, v + 1))}
            >
              +
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={remainingSessions + 10}
            value={attendMore}
            onChange={(e) => setAttendMore(Number(e.target.value))}
            className="w-full accent-green-500"
          />
          <div className="text-xs text-muted-foreground">
            more sessions →{" "}
            <span className={`font-bold ${statusColor(attendResult.status)}`}>
              {attendResult.projectedPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Skip more */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            If I skip
          </label>
          <div className="flex items-center gap-2">
            <button
              className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-lg font-bold leading-none transition-colors"
              onClick={() => setSkipMore((v) => Math.max(0, v - 1))}
            >
              −
            </button>
            <span className="text-lg font-bold text-foreground w-8 text-center">{skipMore}</span>
            <button
              className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-lg font-bold leading-none transition-colors"
              onClick={() => setSkipMore((v) => Math.min(remainingSessions + 20, v + 1))}
            >
              +
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={remainingSessions + 10}
            value={skipMore}
            onChange={(e) => setSkipMore(Number(e.target.value))}
            className="w-full accent-red-500"
          />
          <div className="text-xs text-muted-foreground">
            more sessions →{" "}
            <span className={`font-bold ${statusColor(skipResult.status)}`}>
              {skipResult.projectedPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
          <span>0%</span>
          <span className="text-red-400">Danger ({minPct - 5}%)</span>
          <span className="text-yellow-500">Warn ({minPct}%)</span>
          <span className="text-green-500">Safe ({minPct + 5}%)</span>
          <span>100%</span>
        </div>
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          {/* Zone markers */}
          <div
            className="absolute top-0 bottom-0 bg-red-500/20"
            style={{ left: 0, width: `${minPct}%` }}
          />
          <div
            className="absolute top-0 bottom-0 bg-yellow-500/20"
            style={{ left: `${minPct}%`, width: "5%" }}
          />
          {/* Filled bar */}
          <div
            className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500 ${barColor(combinedResult.status)}`}
            style={{ width: `${barPct}%` }}
          />
          {/* Min line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/60"
            style={{ left: `${minPct}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Combined scenario:{" "}
            <span className={`font-bold ${statusColor(combinedResult.status)}`}>
              {combinedResult.projectedPercentage.toFixed(1)}%
            </span>
          </span>
          <span className="flex items-center gap-1 text-xs">
            {statusIcon(combinedResult.status)}
            <span className={statusColor(combinedResult.status)}>
              {combinedResult.status.charAt(0).toUpperCase() + combinedResult.status.slice(1)}
            </span>
          </span>
        </div>
      </div>

      {/* Danger zone warning */}
      {dangerZone && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-500 animate-in fade-in duration-200">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Danger zone!</strong> This scenario drops you below the {minPct}% minimum.
          </span>
        </div>
      )}

      {/* Reset */}
      {(attendMore > 0 || skipMore > 0) && (
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          onClick={() => { setAttendMore(0); setSkipMore(0) }}
        >
          Reset simulator
        </button>
      )}
    </div>
  )
}

// ─── Stats Card ─────────────────────────────────────────────────────────────

interface StatsCardProps {
  stats: AttendanceStats
  color: string
  onMinChange: (classTypeId: string, value: number) => Promise<void>
}

function StatsCard({ stats, color, onMinChange }: StatsCardProps) {
  const [localMin, setLocalMin] = useState(stats.minAttendance)
  const [saving, setSaving] = useState(false)

  const [prevStatsMin, setPrevStatsMin] = useState(stats.minAttendance)

  if (stats.minAttendance !== prevStatsMin) {
    setPrevStatsMin(stats.minAttendance)
    setLocalMin(stats.minAttendance)
  }

  const handleMinSave = async (val: number) => {
    setSaving(true)
    await onMinChange(stats.classTypeId, val)
    setSaving(false)
  }

  const currentStatus = calculateAttendanceStatus(stats.currentPercentage, localMin)
  const pct = Math.min(100, stats.currentPercentage)

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      {/* Color accent top bar */}
      <div className="h-1 w-full" style={{ background: color }} />

      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color }} />
            {stats.classTypeName}
          </h3>
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${statusColor(stats.status)}`}>
            {statusIcon(stats.status)}
            <span className="capitalize">{stats.status}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current</span>
            <span className={`font-bold text-lg ${statusColor(stats.status)}`}>
              {stats.currentPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700 ${barColor(currentStatus)}`}
              style={{ width: `${pct}%` }}
            />
            {/* Min line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/60"
              style={{ left: `${localMin}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Required: {localMin}%</span>
            <span>Projected: {stats.projectedPercentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">
              Present
            </p>
            <p className="text-sm font-bold text-foreground">
              {stats.hoursPresent}h
            </p>
            <p className="text-[10px] text-muted-foreground">of {stats.hoursHeld}h held</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">
              Semester
            </p>
            <p className="text-sm font-bold text-foreground">{stats.totalHours}h</p>
            <p className="text-[10px] text-muted-foreground">total planned</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">
              Per Session
            </p>
            <p className="text-sm font-bold text-foreground">{stats.hoursPerSession}h</p>
            <p className="text-[10px] text-muted-foreground">per class</p>
          </div>
        </div>

        {/* Safe bunks / classes needed */}
        {stats.status === "danger" ? (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              You need <strong>{stats.classesNeeded}</strong> more sessions to reach {localMin}%
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                You can safely miss <strong>{stats.safeBunks}</strong> more hour{stats.safeBunks !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-4 py-2.5">
              <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Projected if you miss all remaining:{" "}
                <span className={`font-bold ${statusColor(calculateAttendanceStatus(stats.projectedPercentage, localMin))}`}>
                  {stats.projectedPercentage.toFixed(1)}%
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Quick min attendance editor */}
        <div className="border-t border-border/50 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Adjust Required %
            </label>
            <span className="text-sm font-bold text-primary">{localMin}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={localMin}
            onChange={(e) => setLocalMin(Number(e.target.value))}
            onMouseUp={() => handleMinSave(localMin)}
            onTouchEnd={() => handleMinSave(localMin)}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
          {saving && (
            <p className="text-[11px] text-muted-foreground animate-pulse">Saving…</p>
          )}
        </div>

        {/* Bunk Simulator */}
        <BunkSimulator stats={{ ...stats, minAttendance: localMin }} />
      </div>
    </div>
  )
}

// ─── Mini Calendar ───────────────────────────────────────────────────────────

interface MiniCalendarProps {
  year: number
  month: number
  records: AttendanceRecord[]
  classTypeIds: string[]
  onDayClick: (date: string) => void
  onPrev: () => void
  onNext: () => void
}

function MiniCalendar({
  year,
  month,
  records,
  classTypeIds,
  onDayClick,
  onPrev,
  onNext,
}: MiniCalendarProps) {
  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  // Build day → statuses map for THIS subject
  const dayMap = useMemo(() => {
    const map: Record<string, AttendanceStatus[]> = {}
    for (const r of records) {
      if (!classTypeIds.includes(r.class_type_id)) continue
      const day = r.date.slice(0, 10)
      if (!map[day]) map[day] = []
      map[day].push(r.status)
    }
    return map
  }, [records, classTypeIds])

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = toLocalDateStr(new Date())

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  })

  function getDotColor(statuses: AttendanceStatus[] | undefined): string | null {
    if (!statuses || statuses.length === 0) return null
    const meaningful = statuses.filter((s) => s === "PRESENT" || s === "ABSENT")
    if (meaningful.length === 0) {
      // only cancelled/holiday
      return statuses.some((s) => s === "HOLIDAY") ? "bg-blue-400" : "bg-gray-400"
    }
    if (meaningful.some((s) => s === "ABSENT") && meaningful.some((s) => s === "PRESENT")) {
      return "bg-yellow-400" // mixed
    }
    if (meaningful.every((s) => s === "PRESENT")) return "bg-green-500"
    return "bg-red-500"
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e${i}`} />)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    const statuses = dayMap[dateStr]
    const dotColor = getDotColor(statuses)
    const isToday = dateStr === today

    cells.push(
      <button
        key={dateStr}
        onClick={() => onDayClick(dateStr)}
        className={`
          relative flex flex-col items-center justify-center h-9 w-full rounded-xl text-sm font-medium
          transition-all duration-150 hover:bg-muted/60
          ${isToday ? "ring-2 ring-primary bg-primary/10 text-primary" : "text-foreground"}
        `}
      >
        {d}
        {dotColor && (
          <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${dotColor}`} />
        )}
      </button>
    )
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-5 space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          {monthLabel}
        </h4>
        <div className="flex gap-1">
          <button
            onClick={onPrev}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase py-1">
            {d}
          </div>
        ))}
        {cells}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1 border-t border-border/50">
        {[
          { color: "bg-green-500", label: "Present" },
          { color: "bg-red-500", label: "Absent" },
          { color: "bg-yellow-400", label: "Mixed" },
          { color: "bg-blue-400", label: "Holiday" },
          { color: "bg-gray-400", label: "Cancelled" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Attendance History Table ─────────────────────────────────────────────────

interface HistoryTableProps {
  records: AttendanceRecord[]
  subject: Subject
  onDeleteRecord: (id: string) => Promise<void>
  onUpsertRecord: (payload: {
    class_type_id: string
    date: string
    status: AttendanceRecord["status"]
    notes?: string
  }) => Promise<void>
}

function HistoryTable({ records, subject, onDeleteRecord, onUpsertRecord }: HistoryTableProps) {
  const [filterTypeId, setFilterTypeId] = useState<string>("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<AttendanceStatus>("PRESENT")
  const [editNotes, setEditNotes] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (filterTypeId === "all") return records
    return records.filter((r) => r.class_type_id === filterTypeId)
  }, [records, filterTypeId])

  const startEdit = (r: AttendanceRecord) => {
    setEditingId(r.id)
    setEditStatus(r.status)
    setEditNotes(r.notes ?? "")
  }

  const saveEdit = async (r: AttendanceRecord) => {
    await onUpsertRecord({
      class_type_id: r.class_type_id,
      date: r.date,
      status: editStatus,
      notes: editNotes,
    })
    setEditingId(null)
  }

  const confirmDelete = async (id: string) => {
    setDeletingId(id)
    await onDeleteRecord(id)
    setDeletingId(null)
  }

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      {/* Filter tabs */}
      <div className="flex gap-1 p-4 border-b border-border/60 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilterTypeId("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            filterTypeId === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {subject.class_types.map((ct) => (
          <button
            key={ct.id}
            onClick={() => setFilterTypeId(ct.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filterTypeId === ct.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {ct.name}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No records yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Class Type
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const ct = subject.class_types.find((c) => c.id === r.class_type_id)
                const sConf = STATUS_CONFIG[r.status]
                const isEditing = editingId === r.id
                const isDeleting = deletingId === r.id

                return (
                  <tr
                    key={r.id}
                    className={`border-b border-border/30 transition-colors ${
                      isEditing ? "bg-muted/30" : "hover:bg-muted/20"
                    }`}
                  >
                    <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap">
                      {formatDate(r.date)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                      {ct?.name ?? "Unknown"}
                    </td>
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                          className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground"
                        >
                          {(["PRESENT", "ABSENT", "CANCELLED", "HOLIDAY"] as AttendanceStatus[]).map(
                            (s) => (
                              <option key={s} value={s}>
                                {STATUS_CONFIG[s].label}
                              </option>
                            )
                          )}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sConf.bg} ${sConf.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sConf.dot}`} />
                          {sConf.label}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground max-w-[200px]">
                      {isEditing ? (
                        <input
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Notes…"
                          className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground w-full"
                        />
                      ) : (
                        <span className="truncate block text-xs">{r.notes || "—"}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(r)}
                              className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs hover:text-foreground transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(r)}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => confirmDelete(r.id)}
                              disabled={isDeleting}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500"
                            >
                              {isDeleting ? (
                                <span className="w-3.5 h-3.5 block animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Day Records Panel ───────────────────────────────────────────────────────

interface DayRecordsPanelProps {
  date: string
  records: AttendanceRecord[]
  subject: Subject
  onClose: () => void
  onUpsert: (payload: {
    class_type_id: string
    date: string
    status: AttendanceRecord["status"]
    notes?: string
  }) => Promise<void>
}

function DayRecordsPanel({ date, records, subject, onClose, onUpsert }: DayRecordsPanelProps) {
  const dayRecords = records.filter((r) => r.date.slice(0, 10) === date)
  const [localStatuses, setLocalStatuses] = useState<Record<string, AttendanceStatus>>(() => {
    const init: Record<string, AttendanceStatus> = {}
    for (const ct of subject.class_types) {
      const r = dayRecords.find((x) => x.class_type_id === ct.id)
      init[ct.id] = r?.status ?? "PRESENT"
    }
    return init
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    for (const ct of subject.class_types) {
      await onUpsert({
        class_type_id: ct.id,
        date,
        status: localStatuses[ct.id],
      })
    }
    setSaving(false)
    onClose()
  }

  return (
    <div className="rounded-3xl border border-primary/30 bg-card p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-foreground">{formatDate(date)}</h4>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors text-lg"
        >
          ×
        </button>
      </div>
      <div className="space-y-3">
        {subject.class_types.map((ct) => (
          <div key={ct.id} className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{ct.name}</span>
            <div className="flex gap-1">
              {(["PRESENT", "ABSENT", "CANCELLED", "HOLIDAY"] as AttendanceStatus[]).map((s) => {
                const active = localStatuses[ct.id] === s
                const conf = STATUS_CONFIG[s]
                return (
                  <button
                    key={s}
                    onClick={() => setLocalStatuses((prev) => ({ ...prev, [ct.id]: s }))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      active
                        ? `${conf.bg} ${conf.text} ring-1 ring-current`
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {conf.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-xl"
          size="sm"
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="outline" onClick={onClose} className="rounded-xl" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { updateSubject, deleteSubject } = useSubjects()

  const {
    subject,
    records,
    statsPerType,
    loading,
    error,
    refresh,
    updateMinAttendance,
    deleteRecord,
    upsertRecord,
  } = useSubjectDetail(id ?? "")

  useEffect(() => {
    if (subject) {
      document.title = `${subject.name} | RollCall`
    } else {
      document.title = "Subject Details | RollCall"
    }
  }, [subject])

  // Calendar state
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handlePrevMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 1) { setCalYear((y) => y - 1); return 12 }
      return m - 1
    })
  }, [setCalYear])

  const handleNextMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 12) { setCalYear((y) => y + 1); return 1 }
      return m + 1
    })
  }, [setCalYear])

  const handleEditSubmit = async (formData: unknown) => {
    if (!subject) return
    setModalLoading(true)
    try {
      await updateSubject(subject.id, formData as Parameters<typeof updateSubject>[1])
      refresh()
      setEditModalOpen(false)
    } finally {
      setModalLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!subject) return
    setDeleteLoading(true)
    try {
      await deleteSubject(subject.id)
      navigate("/subjects")
    } finally {
      setDeleteLoading(false)
    }
  }

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading && !subject) {
    return (
      <PageWrapper title="Subject Detail">
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-muted rounded-2xl w-48" />
          <div className="h-28 bg-muted rounded-3xl" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded-3xl" />
            <div className="h-64 bg-muted rounded-3xl" />
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (error || !subject) {
    return (
      <PageWrapper title="Subject Detail">
        <div className="py-16 text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-500/50 mx-auto" />
          <p className="text-muted-foreground">{error ?? "Subject not found."}</p>
          <Button variant="outline" onClick={() => navigate("/subjects")} className="rounded-xl">
            Back to Subjects
          </Button>
        </div>
      </PageWrapper>
    )
  }

  const classTypeIds = subject.class_types.map((ct) => ct.id)

  return (
    <PageWrapper title={subject.name}>
      <div className="space-y-8">
        {/* ── Back link ── */}
        <Link
          to="/subjects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subjects
        </Link>

        {/* ── Subject Header ── */}
        <div
          className="rounded-3xl border border-border bg-card overflow-hidden"
        >
          <div className="h-2" style={{ background: subject.color_tag }} />
          <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ background: subject.color_tag }}
                />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {subject.code ?? "No Code"}
                </span>
                {subject.credits && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">
                    {subject.credits} Credits
                  </span>
                )}
                {subject.semester && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">
                    {subject.semester}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
              <p className="text-sm text-muted-foreground">
                {subject.class_types.length} class type{subject.class_types.length !== 1 ? "s" : ""}
                {" · "}
                {records.length} records total
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit3 className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* ── Stats + Simulator (one card per class type) ── */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Attendance Stats</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {statsPerType.map((stats) => (
              <StatsCard
                key={stats.classTypeId}
                stats={stats}
                color={subject.color_tag}
                onMinChange={updateMinAttendance}
              />
            ))}
          </div>
        </section>

        {/* ── Calendar + Day panel row ── */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Monthly View</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <MiniCalendar
              year={calYear}
              month={calMonth}
              records={records}
              classTypeIds={classTypeIds}
              onDayClick={(d) => setSelectedDay(selectedDay === d ? null : d)}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
            />
            {selectedDay ? (
              <DayRecordsPanel
                date={selectedDay}
                records={records}
                subject={subject}
                onClose={() => setSelectedDay(null)}
                onUpsert={async (p) => { await upsertRecord(p); refresh() }}
              />
            ) : (
              <div className="rounded-3xl border border-border/40 border-dashed bg-muted/10 flex flex-col items-center justify-center py-10 text-center gap-3">
                <Calendar className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Click any day on the calendar to see or edit records
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Attendance History ── */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Attendance History</h2>
          <HistoryTable
            records={records}
            subject={subject}
            onDeleteRecord={deleteRecord}
            onUpsertRecord={async (p) => { await upsertRecord(p); refresh() }}
          />
        </section>
      </div>

      {/* Edit Modal */}
      <SubjectModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        subject={subject}
        loading={modalLoading}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title={`Delete "${subject.name}"?`}
        description="This will permanently delete the subject and all its attendance records. This cannot be undone."
        confirmLabel={deleteLoading ? "Deleting..." : "Delete Subject"}
        confirmTextMatch={subject.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
        variant="destructive"
      />
    </PageWrapper>
  )
}
