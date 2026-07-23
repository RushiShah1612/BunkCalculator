import { useState, useMemo, useCallback } from "react"
import { PageWrapper } from "../components/layout/PageWrapper"
import { useAnalyticsData } from "../hooks/useAnalyticsData"
import { useSubjectStore } from "../store/subjectStore"
import { useSubjects } from "../hooks/useSubjects"
import { useEffect } from "react"
import { supabase } from "../lib/supabase"
import { useToastStore } from "../store/toastStore"
import { calculateClassTypeStats, calculateOverallStats } from "../lib/calculations"
import {
  generateCSV,
  downloadCSV,
  type DateRangePreset,
  type HeatmapCell,
} from "../lib/analyticsHelpers"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Activity,
  FileText,
  Share2,
} from "lucide-react"
import { Button } from "../components/ui/button"
import type { AttendanceRecord, AttendanceStatus } from "../types"
import { useAuthStore } from "../store/authStore"

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; bg: string; text: string }> = {
  PRESENT:   { label: "Present",   bg: "bg-green-500/10",  text: "text-green-600 dark:text-green-400" },
  ABSENT:    { label: "Absent",    bg: "bg-red-500/10",    text: "text-red-500" },
  CANCELLED: { label: "Cancelled", bg: "bg-muted",         text: "text-muted-foreground" },
  HOLIDAY:   { label: "Holiday",   bg: "bg-blue-500/10",   text: "text-blue-500" },
}

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card, 222 47% 11%))",
  borderColor: "hsl(var(--border, 217 33% 17%))",
  borderRadius: "12px",
  border: "1px solid",
  color: "#fff",
  fontSize: "12px",
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className = "",
}: {
  title: string
  subtitle?: string
  icon: React.ElementType
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-card border border-border rounded-3xl p-5 ${className}`}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-bold text-foreground text-base">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="p-2 bg-primary/10 text-primary rounded-xl">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {children}
    </div>
  )
}

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-3xl p-5 animate-pulse ${className}`}>
      <div className="flex justify-between mb-5">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-muted rounded-lg" />
          <div className="h-3 w-48 bg-muted rounded-lg" />
        </div>
        <div className="w-8 h-8 bg-muted rounded-xl" />
      </div>
      <div className="h-56 bg-muted rounded-2xl" />
    </div>
  )
}

// ─── Chart 1: Attendance % Over Time ─────────────────────────────────────────

function AttendanceTrendChart({
  data,
  subjects,
}: {
  data: ReturnType<typeof useAnalyticsData>["timeSeries"]
  subjects: import("../types").Subject[]
}) {
  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
        No data for selected range
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="label"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            stroke="#888"
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            stroke="#888"
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => [`${v}%`, ""]}
          />
          <ReferenceLine
            y={75}
            stroke="#f59e0b"
            strokeDasharray="6 3"
            label={{ value: "75% min", position: "right", fontSize: 10, fill: "#f59e0b" }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
          />
          {subjects.map((sub: import("../types").Subject) => (
            <Line
              key={sub.id}
              type="monotone"
              dataKey={sub.id}
              name={sub.code || sub.name}
              stroke={sub.color_tag}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Chart 2: Present vs Absent per Subject ──────────────────────────────────

function SubjectComparisonChart({
  data,
}: {
  data: import("../lib/analyticsHelpers").ComparisonPoint[]
}) {
  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
        No data for selected range
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="subject" fontSize={10} tickLine={false} axisLine={false} stroke="#888" />
          <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#888" />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v, name) => [
              `${v}h`,
              name === "hoursPresent" ? "Present" : "Absent",
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
            formatter={(value) => (value === "hoursPresent" ? "Present" : "Absent")}
          />
          <Bar dataKey="hoursPresent" name="hoursPresent" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar dataKey="hoursAbsent" name="hoursAbsent" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Chart 3: Class Type Donut ────────────────────────────────────────────────

function ClassTypeDonut({
  data,
}: {
  data: import("../lib/analyticsHelpers").ClassTypeBreakdownPoint[]
}) {
  const totalHours = data.reduce((s, d) => s + d.hours, 0)

  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
        No subjects configured
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <div className="h-52 w-full md:w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="hours"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              strokeWidth={2}
              stroke="hsl(var(--card))"
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v, name) => [`${v}h`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Center label */}
      <div className="space-y-2 w-full">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Total: {totalHours}h planned
        </p>
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-sm text-foreground">{d.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{d.hours}h</span>
              <span className="font-bold text-foreground">{d.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Chart 4: Monthly Heatmap ─────────────────────────────────────────────────

const HEATMAP_COLORS: Record<HeatmapCell["intensity"], string> = {
  none:    "bg-muted/40",
  noclass: "bg-muted/20",
  full:    "bg-green-500",
  partial: "bg-green-300/70",
  absent:  "bg-red-500",
}

function MonthHeatmap({ cells, year, month }: { cells: HeatmapCell[]; year: number; month: number }) {
  const DAYS = ["S", "M", "T", "W", "T", "F", "S"]
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  })

  const dateMap: Record<string, HeatmapCell> = {}
  for (const c of cells) dateMap[c.date] = c

  const gridCells = []
  for (let i = 0; i < firstDay; i++) gridCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    gridCells.push(dateMap[dateStr] ?? null)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-muted-foreground">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-[9px] text-muted-foreground text-center font-medium py-0.5">
            {d}
          </div>
        ))}
        {gridCells.map((cell, i) =>
          cell ? (
            <div
              key={i}
              title={cell.tooltip}
              className={`w-full aspect-square rounded-sm cursor-help transition-opacity hover:opacity-80 ${HEATMAP_COLORS[cell.intensity]}`}
            />
          ) : (
            <div key={i} />
          )
        )}
      </div>
    </div>
  )
}

function AttendanceHeatmap({ heatmap }: { heatmap: HeatmapCell[] }) {
  const months: Array<{ year: number; month: number }> = []
  const today = new Date()
  for (let i = 2; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-6">
        {months.map(({ year, month }) => (
          <MonthHeatmap key={`${year}-${month}`} cells={heatmap} year={year} month={month} />
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 border-t border-border/50">
        {[
          { color: "bg-green-500", label: "All present" },
          { color: "bg-green-300/70", label: "Partial" },
          { color: "bg-red-500", label: "All absent" },
          { color: "bg-muted/40", label: "Cancelled" },
          { color: "bg-muted/20", label: "No class" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={`w-3 h-3 rounded-sm ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Chart 5: Subject Gauge Grid ─────────────────────────────────────────────

function AttendanceGauge({ percentage, min }: { percentage: number; min: number; color: string }) {
  const capped = Math.min(100, Math.max(0, percentage))
  const status = percentage < min ? "danger" : percentage <= min + 5 ? "warning" : "safe"
  const statusColors = { danger: "#ef4444", warning: "#f59e0b", safe: "#22c55e" }
  const statusLabels = { danger: "Danger", warning: "Warning", safe: "Safe" }

  // SVG arc gauge
  const cx = 50
  const cy = 50
  const startAngle = -210
  const endAngle = 30
  const totalAngle = endAngle - startAngle
  const valueAngle = startAngle + (capped / 100) * totalAngle
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const arcPath = (start: number, end: number, innerR: number, outerR: number) => {
    const s = toRad(start)
    const e = toRad(end)
    const x1 = cx + outerR * Math.cos(s)
    const y1 = cy + outerR * Math.sin(s)
    const x2 = cx + outerR * Math.cos(e)
    const y2 = cy + outerR * Math.sin(e)
    const xi1 = cx + innerR * Math.cos(s)
    const yi1 = cy + innerR * Math.sin(s)
    const xi2 = cx + innerR * Math.cos(e)
    const yi2 = cy + innerR * Math.sin(e)
    const large = e - s > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 ${large} 0 ${xi1} ${yi1} Z`
  }

  const needleX = cx + 30 * Math.cos(toRad(valueAngle))
  const needleY = cy + 30 * Math.sin(toRad(valueAngle))

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 70" className="w-24 h-16">
        {/* Background arc */}
        <path d={arcPath(startAngle, endAngle, 28, 38)} fill="rgba(255,255,255,0.06)" />
        {/* Danger zone */}
        <path d={arcPath(startAngle, startAngle + (min / 100) * totalAngle, 28, 38)} fill="#ef444440" />
        {/* Warning zone */}
        <path
          d={arcPath(
            startAngle + (min / 100) * totalAngle,
            startAngle + ((min + 5) / 100) * totalAngle,
            28, 38
          )}
          fill="#f59e0b40"
        />
        {/* Value arc */}
        <path
          d={arcPath(startAngle, valueAngle, 28, 38)}
          fill={statusColors[status]}
          opacity={0.9}
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={statusColors[status]}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={3} fill={statusColors[status]} />
        {/* % label */}
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize={10} fontWeight="bold" fill="currentColor">
          {capped.toFixed(1)}%
        </text>
      </svg>
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: statusColors[status] + "20", color: statusColors[status] }}
      >
        {statusLabels[status]}
      </span>
    </div>
  )
}

function GaugeGrid({ allStats, subjects }: {
  allStats: import("../types").AttendanceStats[]
  subjects: import("../types").Subject[]
}) {
  // Aggregate per subject
  const subjectStats = subjects.map((sub: import("../types").Subject) => {
    const subStats = allStats.filter((s) =>
      sub.class_types.some((ct: import("../types").ClassTypeConfig) => ct.id === s.classTypeId)
    )
    const totalHeld = subStats.reduce((a, s) => a + s.hoursHeld, 0)
    const totalPresent = subStats.reduce((a, s) => a + s.hoursPresent, 0)
    const pct = totalHeld > 0 ? (totalPresent / totalHeld) * 100 : 0
    const minPct = sub.min_attendance ?? 75
    return { sub, pct, minPct }
  })

  if (subjectStats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">No subjects</div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
      {subjectStats.map(({ sub, pct, minPct }: { sub: import("../types").Subject; pct: number; minPct: number }) => (
        <div key={sub.id} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-muted/20 border border-border/40">
          <div
            className="w-2 h-2 rounded-full mb-1"
            style={{ background: sub.color_tag }}
          />
          <p className="text-xs font-bold text-foreground text-center leading-tight line-clamp-1">
            {sub.code || sub.name}
          </p>
          <AttendanceGauge percentage={pct} min={minPct} color={sub.color_tag} />
        </div>
      ))}
    </div>
  )
}

// ─── Filters Bar ──────────────────────────────────────────────────────────────

interface FiltersBarProps {
  filters: ReturnType<typeof useAnalyticsData>["filters"]
  setFilters: ReturnType<typeof useAnalyticsData>["setFilters"]
  subjects: import("../types").Subject[]
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
  week: "This Week",
  month: "This Month",
  semester: "This Semester",
  custom: "Custom",
}

function FiltersBar({ filters, setFilters, subjects }: FiltersBarProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-1">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filters</span>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-1 flex-wrap">
        {(["week", "month", "semester", "custom"] as DateRangePreset[]).map((p) => (
          <button
            key={p}
            onClick={() => setFilters({ preset: p })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filters.preset === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {PRESET_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {filters.preset === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.customFrom}
            onChange={(e) => setFilters({ customFrom: e.target.value })}
            className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={filters.customTo}
            onChange={(e) => setFilters({ customTo: e.target.value })}
            className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground"
          />
        </div>
      )}

      {/* Subject multi-select */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setFilters({ subjectIds: [] })}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filters.subjectIds.length === 0
              ? "bg-primary/20 text-primary ring-1 ring-primary/40"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All Subjects
        </button>
        {subjects.map((s: import("../types").Subject) => {
          const active = filters.subjectIds.includes(s.id)
          return (
            <button
              key={s.id}
              onClick={() => {
                const ids = active
                  ? filters.subjectIds.filter((id) => id !== s.id)
                  : [...filters.subjectIds, s.id]
                setFilters({ subjectIds: ids })
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-l-2 ${
                active
                  ? "bg-primary/10 text-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              style={{ borderLeftColor: active ? s.color_tag : "transparent" }}
            >
              {s.code || s.name}
            </button>
          )
        })}
      </div>

      {/* Include Archived toggle */}
      <div className="flex items-center gap-2 ml-auto">
        <label className="text-xs text-muted-foreground flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.includeArchived}
            onChange={(e) => setFilters({ includeArchived: e.target.checked })}
            className="rounded border-border text-primary focus:ring-primary/40 bg-background"
          />
          Include Archived
        </label>
      </div>
    </div>
  )
}

// ─── Full Attendance Log Table ────────────────────────────────────────────────

type SortKey = "date" | "subject" | "classType" | "status" | "hours"
type SortDir = "asc" | "desc"

interface EnrichedRecord {
  id: string
  date: string
  subjectName: string
  subjectCode: string
  classTypeName: string
  status: AttendanceStatus
  hours: number
  notes: string | null
}

function AttendanceLogTable({
  records,
  subjects,
}: {
  records: AttendanceRecord[]
  subjects: import("../types").Subject[]
}) {
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | "all">("all")
  const [search, setSearch] = useState("")
  const PAGE_SIZE = 25

  // Build lookup maps
  const { ctMap, subMap } = useMemo(() => {
    const ctMap: Record<string, { name: string; hours: number; subjectId: string }> = {}
    const subMap: Record<string, { name: string; code: string }> = {}
    for (const sub of subjects) {
      subMap[sub.id] = { name: sub.name, code: sub.code || sub.name.slice(0, 6) }
      for (const ct of sub.class_types) {
        ctMap[ct.id] = { name: ct.name, hours: ct.hours_per_session, subjectId: sub.id }
      }
    }
    return { ctMap, subMap }
  }, [subjects])

  const enriched = useMemo<EnrichedRecord[]>(() => {
    return records.map((r) => {
      const ct = ctMap[r.class_type_id]
      const sub = ct ? subMap[ct.subjectId] : null
      return {
        id: r.id,
        date: r.date.slice(0, 10),
        subjectName: sub?.name ?? "—",
        subjectCode: sub?.code ?? "—",
        classTypeName: ct?.name ?? "—",
        status: r.status,
        hours: ct?.hours ?? 0,
        notes: r.notes,
      }
    })
  }, [records, ctMap, subMap])

  const filtered = useMemo(() => {
    return enriched.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false
      if (search && !r.notes?.toLowerCase().includes(search.toLowerCase()) &&
          !r.subjectName.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [enriched, filterStatus, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const rawVa = a[sortKey as keyof EnrichedRecord]
      const rawVb = b[sortKey as keyof EnrichedRecord]
      let va: string | number = typeof rawVa === "number" ? rawVa : String(rawVa ?? "")
      let vb: string | number = typeof rawVb === "number" ? rawVb : String(rawVb ?? "")
      if (typeof va === "string") va = (va as string).toLowerCase()
      if (typeof vb === "string") vb = (vb as string).toLowerCase()
      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("desc") }
    setPage(1)
  }

  const renderSortBtn = (k: SortKey, label: string) => (
    <button
      onClick={() => handleSort(k)}
      className="flex items-center gap-1 hover:text-foreground transition-colors font-bold text-xs uppercase tracking-wider"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "text-primary" : ""}`} />
    </button>
  )

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      {/* Controls */}
      <div className="p-4 border-b border-border/60 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {(["all", "PRESENT", "ABSENT", "CANCELLED", "HOLIDAY"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search notes or subject…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="text-xs border border-border rounded-xl px-3 py-1.5 bg-background text-foreground w-48 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Table */}
      {pageData.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No records match your filters</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                <th className="px-5 py-3 text-left">{renderSortBtn("date", "Date")}</th>
                <th className="px-5 py-3 text-left">{renderSortBtn("subject", "Subject")}</th>
                <th className="px-5 py-3 text-left">{renderSortBtn("classType", "Class Type")}</th>
                <th className="px-5 py-3 text-left">{renderSortBtn("status", "Status")}</th>
                <th className="px-5 py-3 text-left">{renderSortBtn("hours", "Hours")}</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((r) => {
                const sc = STATUS_CONFIG[r.status]
                return (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3 text-foreground whitespace-nowrap font-medium">
                      {new Date(r.date + "T00:00:00").toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-foreground font-medium">{r.subjectCode}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.classTypeName}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{r.hours}h</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs max-w-[180px] truncate">
                      {r.notes || "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="px-5 py-3 border-t border-border/60 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {sorted.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
          {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} records
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground px-2">
            {page} / {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Export Dropdown ──────────────────────────────────────────────────────────

function ExportMenu({
  records,
  subjects,
  userName,
}: {
  records: AttendanceRecord[]
  subjects: import("../types").Subject[]
  userName: string
}) {
  const [open, setOpen] = useState(false)

  const handleCSV = useCallback(() => {
    const csv = generateCSV(records, subjects)
    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(csv, `attendance_${userName}_${date}.csv`)
    setOpen(false)
  }, [records, subjects, userName])

  const handlePrint = useCallback(() => {
    setOpen(false)
    setTimeout(() => window.print(), 100)
  }, [])

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl flex items-center gap-1.5"
        onClick={() => setOpen((o) => !o)}
      >
        <Download className="w-4 h-4" />
        Export
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden min-w-[180px] animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              onClick={handleCSV}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left"
            >
              <FileText className="w-4 h-4 text-green-500" />
              Export as CSV
            </button>
            <button
              onClick={handlePrint}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left border-t border-border/50"
            >
              <FileText className="w-4 h-4 text-blue-500" />
              Print / Save PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Print Styles ─────────────────────────────────────────────────────────────

const PRINT_STYLES = `
@media print {
  body { background: white !important; color: black !important; }
  nav, aside, [data-no-print], .no-print { display: none !important; }
  .print-break { page-break-before: always; }
  * { box-shadow: none !important; }
}
`

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { subjects } = useSubjectStore()
  const { fetchSubjects } = useSubjects()
  const { profile, user } = useAuthStore()
  const { toast } = useToastStore()
  const [shareLoading, setShareLoading] = useState(false)

  const {
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
    relevantSubjects,
  } = useAnalyticsData()

  // Set document title
  useEffect(() => {
    document.title = "Analytics & Insights | RollCall"
  }, [])

  // Ensure subjects are loaded
  useEffect(() => {
    if (subjects.length === 0) fetchSubjects()
  }, [fetchSubjects, subjects.length])

  const handleShareReport = async () => {
    if (!user) return
    setShareLoading(true)
    try {
      // Calculate statistics for each subject in relevantSubjects list
      const overallSubjects = relevantSubjects.map((s: import("../types").Subject) => {
        const ctStats = s.class_types.map((ct: import("../types").ClassTypeConfig) => calculateClassTypeStats(ct, allRecords, s.min_attendance))
        const agg = calculateOverallStats(ctStats)
        return {
          name: s.name,
          code: s.code,
          color: s.color_tag,
          percentage: agg.overallPercentage,
          classTypes: ctStats.map((stat: import("../types").AttendanceStats) => ({
            name: stat.classTypeName,
            percentage: stat.currentPercentage,
            attended: stat.hoursPresent,
            total: stat.hoursHeld
          }))
        }
      })

      // Aggregate overall attendance percentage
      const allClassTypeStats = relevantSubjects.flatMap((s: import("../types").Subject) => 
        s.class_types.map((ct: import("../types").ClassTypeConfig) => calculateClassTypeStats(ct, allRecords, s.min_attendance))
      )
      const globalOverall = calculateOverallStats(allClassTypeStats).overallPercentage

      const reportData = {
        studentName: profile?.full_name || user.email || "Student",
        semester: profile?.semester || "N/A",
        overallAttendance: globalOverall,
        subjects: overallSubjects
      }

      // Expires in 7 days
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { data, error: insertError } = await supabase
        .from("shared_reports")
        .insert({
          user_id: user.id,
          report_data: reportData,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError
      if (!data) throw new Error("Failed to generate shared report link")

      const shareUrl = `${window.location.origin}/report/${data.id}`
      await navigator.clipboard.writeText(shareUrl)
      toast("Shareable report link copied to clipboard! Expires in 7 days.", "success")
    } catch (err: unknown) {
      console.error(err)
      const errorMsg = err instanceof Error ? err.message : "Failed to share report"
      toast(errorMsg, "error")
    } finally {
      setShareLoading(false)
    }
  }

  const filteredSubjects = useMemo(
    () =>
      filters.subjectIds.length > 0
        ? relevantSubjects.filter((s: import("../types").Subject) => filters.subjectIds.includes(s.id))
        : relevantSubjects,
    [relevantSubjects, filters.subjectIds]
  )

  const userName = profile?.full_name?.replace(/\s+/g, "_") || "student"

  return (
    <PageWrapper title="Analytics & Insights">
      {/* Print styles */}
      <style>{PRINT_STYLES}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 no-print" data-no-print>
        <div>
          <h2 className="text-xl font-bold text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            {allRecords.length} total records · {relevantSubjects.length} subjects
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={refresh}
          >
            <RefreshCw className="w-4 h-4 mr-1.5 animate-spin-hover" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={handleShareReport}
            disabled={shareLoading || relevantSubjects.length === 0}
          >
            <Share2 className="w-4 h-4 mr-1.5 text-primary" />
            {shareLoading ? "Sharing..." : "Share"}
          </Button>
          <ExportMenu
            records={filteredRecords}
            subjects={relevantSubjects}
            userName={userName}
          />
        </div>
      </div>

      {/* ── Print Header (only visible when printing) ── */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Attendance Report</h1>
        <p className="text-sm text-gray-600">
          Student: {profile?.full_name} · Semester: {profile?.semester || "—"} · Generated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="mb-6 no-print" data-no-print>
        <FiltersBar filters={filters} setFilters={setFilters} subjects={relevantSubjects} />
      </div>

      {/* ── Charts Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Chart 1: Trend Line */}
            <ChartCard
              title="Attendance % Over Time"
              subtitle="Cumulative attendance trend per subject"
              icon={TrendingUp}
            >
              <AttendanceTrendChart data={timeSeries} subjects={filteredSubjects} />
            </ChartCard>

            {/* Chart 2: Present vs Absent */}
            <ChartCard
              title="Present vs Absent Hours"
              subtitle="Hours comparison by subject"
              icon={BarChart3}
            >
              <SubjectComparisonChart data={comparison} />
            </ChartCard>

            {/* Chart 3: Donut */}
            <ChartCard
              title="Class Type Distribution"
              subtitle="Planned hours by class component"
              icon={PieIcon}
            >
              <ClassTypeDonut data={classTypeBreakdown} />
            </ChartCard>

            {/* Chart 5: Gauge Grid */}
            <ChartCard
              title="Attendance Gauges"
              subtitle="Per-subject attendance overview"
              icon={Activity}
            >
              <GaugeGrid allStats={allStats} subjects={filteredSubjects} />
            </ChartCard>
          </div>

          {/* Chart 4: Heatmap — full width */}
          <ChartCard
            title="Monthly Attendance Heatmap"
            subtitle="Last 3 months · GitHub-style contribution view"
            icon={Calendar}
            className="mb-6"
          >
            <AttendanceHeatmap heatmap={heatmap} />
          </ChartCard>

          {/* Chart: Detailed Log */}
          <ChartCard
            title="Detailed Attendance Log"
            subtitle="Full history of records"
            icon={FileText}
            className="mb-12"
          >
            <AttendanceLogTable records={filteredRecords} subjects={relevantSubjects} />
          </ChartCard>
        </>
      )}
    </PageWrapper>
  )
}
