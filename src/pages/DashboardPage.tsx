import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { PageWrapper } from "../components/layout/PageWrapper"
import { StatusBadge } from "../components/shared/StatusBadge"
import { Button } from "../components/ui/button"
import { useAuthStore } from "../store/authStore"
import { useAttendance } from "../hooks/useAttendance"
import { useDashboardData } from "../hooks/useDashboardData"
import { useNotificationAlerts } from "../hooks/useNotificationAlerts"
import type { AttendanceStatus, Subject } from "../types"
import { useToastStore } from "../store/toastStore"
import { seedDemoData, clearDemoData } from "../lib/seedDemoData"
import { useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  AlertTriangle,
  AlertCircle,
  X,
  BookOpen,
  RefreshCcw,
  Flame,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  CalendarCheck,
  ArrowUpRight,
  Check,
  Minus,
} from "lucide-react"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

const SUBJECT_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6",
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted/60 rounded-2xl ${className}`} />
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  colorClass?: string
  trend?: string
}

function StatCard({ label, value, subtitle, icon, colorClass = "text-primary", trend }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-3xl p-5 flex flex-col gap-3 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br from-primary/5 to-primary/0 group-hover:scale-150 transition-transform duration-500" />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className={`p-2 rounded-xl bg-muted/60 ${colorClass}`}>{icon}</div>
      </div>
      <div>
        <p className={`text-3xl font-black tracking-tight ${colorClass}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {trend && (
        <span className="text-[10px] font-semibold text-muted-foreground">{trend}</span>
      )}
    </div>
  )
}

// ─── Alert Banners ────────────────────────────────────────────────────────────

interface AlertBannersProps {
  subjectStats: {
    subject: Subject
    classTypeStats: import("../types").AttendanceStats[]
    overallPct: number
    overallStatus: "safe" | "warning" | "danger"
    totalSafeBunks: number
  }[]
}

function AlertBanners({ subjectStats }: AlertBannersProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const atRisk = subjectStats.filter(
    (s) => (s.overallStatus === "danger" || s.overallStatus === "warning") &&
      !dismissed.has(s.subject.id)
  )

  if (atRisk.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {atRisk.map(({ subject, overallStatus, classTypeStats }) => {
        const isDanger = overallStatus === "danger"
        const totalNeeded = classTypeStats.reduce((a, s) => a + s.classesNeeded, 0)

        return (
          <div
            key={subject.id}
            className={`flex items-start gap-3 p-4 rounded-2xl border text-sm animate-in fade-in duration-200 ${
              isDanger
                ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400"
                : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400"
            }`}
          >
            {isDanger
              ? <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            }
            <div className="flex-1 min-w-0">
              <p className="font-semibold">
                {isDanger ? "⚠️" : "🔔"} {subject.name} is {isDanger ? "below" : "close to"} the attendance minimum!
              </p>
              {totalNeeded > 0 && (
                <p className="text-xs opacity-80 mt-0.5">
                  Attend {totalNeeded} more session{totalNeeded !== 1 ? "s" : ""} to reach the required percentage.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/attendance"
                className="text-xs font-semibold underline underline-offset-2 hover:no-underline"
              >
                Log now →
              </Link>
              <button
                onClick={() => setDismissed((prev) => new Set([...prev, subject.id]))}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, status }: { pct: number; status: "safe" | "warning" | "danger" }) {
  const colorMap = {
    safe: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  }
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorMap[status]}`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  )
}

// ─── Subject Detail Card ───────────────────────────────────────────────────────

function SubjectDetailCard({
  sw,
  colorIndex,
}: {
  sw: AlertBannersProps["subjectStats"][0]
  colorIndex: number
}) {
  const { subject, classTypeStats, overallPct, overallStatus, totalSafeBunks } = sw
  const accentColor = SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length]

  const statusIcon = {
    safe: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
    danger: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
  }

  return (
    <div
      className="bg-card border border-border rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 group"
      style={{ borderTopColor: accentColor, borderTopWidth: 3 }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-foreground truncate">{subject.name}</h3>
              {subject.code && (
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                  {subject.code}
                </span>
              )}
              {subject.credits && (
                <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                  {subject.credits} cr
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-base font-black ${
                overallStatus === "safe" ? "text-green-600 dark:text-green-400" :
                overallStatus === "warning" ? "text-amber-600 dark:text-amber-400" :
                "text-red-600 dark:text-red-400"
              }`}>{overallPct.toFixed(1)}%</span>
              {statusIcon[overallStatus]}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Safe bunks</p>
            <p className={`text-xl font-black ${totalSafeBunks > 0 ? "text-green-500" : "text-red-500"}`}>
              {totalSafeBunks}
            </p>
          </div>
        </div>
      </div>

      {/* Class type rows */}
      <div className="px-5 py-3 space-y-3">
        {classTypeStats.map((cts) => (
          <div key={cts.classTypeId} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium w-20 shrink-0">{cts.classTypeName}</span>
              <div className="flex-1 mx-2">
                <ProgressBar pct={cts.currentPercentage} status={cts.status} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`font-bold tabular-nums ${
                  cts.status === "safe" ? "text-green-600 dark:text-green-400" :
                  cts.status === "warning" ? "text-amber-600 dark:text-amber-400" :
                  "text-red-600 dark:text-red-400"
                }`}>{cts.currentPercentage.toFixed(0)}%</span>
                {statusIcon[cts.status]}
                {cts.classesNeeded > 0 ? (
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-lg">
                    +{cts.classesNeeded}
                  </span>
                ) : cts.safeBunks > 0 ? (
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-lg">
                    -{cts.safeBunks}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-3 border-t border-border/60 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Overall: <span className="font-semibold text-foreground">{overallPct.toFixed(1)}%</span>
        </span>
        <div className="flex gap-2">
          <Link to="/attendance">
            <Button size="sm" variant="outline" className="rounded-xl h-7 text-[11px]">
              <CalendarCheck className="w-3 h-3 mr-1" />
              Mark Today
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Weekly Bar Chart ──────────────────────────────────────────────────────────

function WeeklyChart({
  weeklyData,
  subjects,
}: {
  weeklyData: import("../hooks/useDashboardData").WeeklyBarEntry[]
  subjects: Subject[]
}) {
  const hasData = weeklyData.some((d) =>
    subjects.some((s) => (d[s.name] as number) > 0)
  )

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <BarChart width={48} height={48} className="opacity-20 mb-3" data={[]} />
        <p className="text-sm font-semibold">No attendance this week</p>
        <p className="text-xs mt-1">Start logging to see your weekly chart</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={12} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-muted-foreground"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-muted-foreground"
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "12px",
            fontSize: "12px",
          }}
          labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
        />
        <Legend
          iconSize={8}
          iconType="circle"
          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
        />
        {subjects.map((s, i) => (
          <Bar
            key={s.id}
            dataKey={s.name}
            stackId="a"
            fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
            radius={i === subjects.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Today's Quick Log ─────────────────────────────────────────────────────────

interface TodayQuickLogProps {
  subjects: Subject[]
  todayRecords: import("../types").AttendanceRecord[]
  onRefresh: () => void
}


function TodayQuickLog({ subjects, todayRecords, onRefresh }: TodayQuickLogProps) {
  const { upsertAttendance } = useAttendance()
  const [saving, setSaving] = useState<string | null>(null)
  const today = toLocalDateStr(new Date())

  const recordMap = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {}
    for (const r of todayRecords) {
      map[r.class_type_id] = r.status
    }
    return map
  }, [todayRecords])

  const allClassTypes = subjects.flatMap((s) =>
    s.class_types.map((ct) => ({ subject: s, ct }))
  )

  const allMarked = allClassTypes.every((x) => recordMap[x.ct.id])

  const markStatus = async (ctId: string, status: AttendanceStatus) => {
    setSaving(ctId)
    try {
      await upsertAttendance([{ class_type_id: ctId, date: today, status }])
      onRefresh()
    } finally {
      setSaving(null)
    }
  }

  if (allClassTypes.length === 0) return null

  return (
    <div className="space-y-2">
      {allMarked ? (
        <div className="flex items-center gap-3 py-6 justify-center text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">All caught up! Everything is marked for today. 🎉</span>
        </div>
      ) : (
        allClassTypes.map(({ subject, ct }) => {
          const status = recordMap[ct.id]
          return (
            <div
              key={ct.id}
              className="flex items-center gap-3 p-3 rounded-2xl border border-border/60 hover:bg-muted/20 transition-colors"
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: subject.color_tag }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{subject.name}</p>
                <p className="text-[10px] text-muted-foreground">{ct.name}</p>
              </div>
              {status ? (
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={status} />
                  <button
                    onClick={() => markStatus(ct.id, status === "PRESENT" ? "ABSENT" : "PRESENT")}
                    disabled={saving === ct.id}
                    className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCcw className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => markStatus(ct.id, "PRESENT")}
                    disabled={saving === ct.id}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40 hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Present
                  </button>
                  <button
                    onClick={() => markStatus(ct.id, "ABSENT")}
                    disabled={saving === ct.id}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1"
                  >
                    <Minus className="w-3 h-3" /> Absent
                  </button>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile, user } = useAuthStore()
  const { toast } = useToastStore()
  const [seederLoading, setSeederLoading] = useState(false)

  const {
    subjects,
    subjectStats,
    overallStats,
    streak,
    weeklyData,
    todayRecords,
    isLoading,
    error,
    refresh,
  } = useDashboardData()

  // Set document title
  useEffect(() => {
    document.title = "Dashboard | RollCall"
  }, [])

  // Generate automated notifications based on current statistics
  useNotificationAlerts(subjectStats)

  const handleDemoDataToggle = async () => {
    if (!user) return
    setSeederLoading(true)
    try {
      const isDemoLoaded = localStorage.getItem("demo-data-loaded") === "true"
      if (isDemoLoaded) {
        await clearDemoData(user.id)
        localStorage.removeItem("demo-data-loaded")
        toast("Demo data cleared successfully", "success")
      } else {
        await seedDemoData(user.id)
        localStorage.setItem("demo-data-loaded", "true")
        toast("Demo data seeded successfully!", "success")
      }
      refresh()
    } catch (err: unknown) {
      console.error(err)
      const errorMsg = err instanceof Error ? err.message : "Failed to process demo data"
      toast(errorMsg, "error")
    } finally {
      setSeederLoading(false)
    }
  }

  const isDemoLoaded = localStorage.getItem("demo-data-loaded") === "true"
  const firstName = profile?.full_name?.split(" ")[0] ?? "there"
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  // Overall status color
  const overallStatusColor =
    overallStats.subjectsAtRisk > 0
      ? "text-red-600 dark:text-red-400"
      : overallStats.subjectsInWarning > 0
      ? "text-amber-600 dark:text-amber-400"
      : "text-green-600 dark:text-green-400"

  return (
    <PageWrapper title="Dashboard">
      {/* ── A) Welcome Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            {getGreeting()}, {firstName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{today}</p>
          {profile?.semester && (
            <p className="text-xs text-muted-foreground mt-0.5">
              📚 {profile.semester}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDemoLoaded && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDemoDataToggle}
              disabled={seederLoading}
              className="rounded-xl h-9 text-xs gap-1.5"
            >
              {seederLoading ? "Clearing..." : "Clear Demo Data"}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={refresh}
            className="rounded-xl h-9 text-xs gap-1.5"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Link to="/attendance">
            <Button size="sm" className="rounded-xl h-9 text-xs gap-1.5 shadow-lg shadow-primary/10">
              <CalendarCheck className="w-3.5 h-3.5" />
              Log Today
            </Button>
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm rounded-2xl p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── B) Summary Stat Cards ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Overall Attendance"
            value={`${overallStats.overallPercentage.toFixed(1)}%`}
            subtitle={`Across ${subjects.length} subject${subjects.length !== 1 ? "s" : ""}`}
            icon={<TrendingUp className="w-4 h-4" />}
            colorClass={overallStatusColor}
          />
          <StatCard
            label="Safe Bunks"
            value={overallStats.totalSafeBunks}
            subtitle={
              overallStats.totalSafeBunks === 0
                ? "No safe bunks remaining!"
                : "Classes you can safely skip"
            }
            icon={<ShieldCheck className="w-4 h-4" />}
            colorClass={overallStats.totalSafeBunks === 0 ? "text-red-500" : "text-green-500"}
          />
          <StatCard
            label="Subjects at Risk"
            value={overallStats.subjectsAtRisk}
            subtitle="Below required attendance"
            icon={<AlertTriangle className="w-4 h-4" />}
            colorClass={overallStats.subjectsAtRisk > 0 ? "text-red-500" : "text-green-500"}
          />
          <StatCard
            label="Current Streak"
            value={streak >= 7 ? `🔥 ${streak}` : streak}
            subtitle="Days attended in a row"
            icon={<Flame className="w-4 h-4" />}
            colorClass={streak >= 7 ? "text-orange-500" : "text-primary"}
          />
        </div>
      )}

      {/* ── C) Alert Banners ──────────────────────────────────────────── */}
      {!isLoading && <AlertBanners subjectStats={subjectStats} />}

      {/* ── D) Subject Cards Grid ─────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Subjects
          </h2>
          <Link to="/subjects" className="text-xs text-primary hover:underline flex items-center gap-1">
            Manage <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl flex flex-col items-center justify-center py-16 text-center px-4">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-foreground mb-1">No subjects yet</p>
            <p className="text-xs text-muted-foreground mb-4">Add your subjects or load realistic demo data to test the tracker</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/subjects">
                <Button size="sm" className="rounded-xl">Add Subjects</Button>
              </Link>
              <Button
                size="sm"
                variant={isDemoLoaded ? "destructive" : "secondary"}
                onClick={handleDemoDataToggle}
                disabled={seederLoading}
                className="rounded-xl"
              >
                {seederLoading ? "Processing..." : isDemoLoaded ? "Clear Demo Data" : "Load Demo Data"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {subjectStats.map((sw, i) => (
              <SubjectDetailCard key={sw.subject.id} sw={sw} colorIndex={i} />
            ))}
          </div>
        )}
      </div>

      {/* ── E) Weekly Chart + F) Today's Quick Log — side by side ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Weekly Activity</h2>
            <span className="text-xs text-muted-foreground">Last 7 days · Hours attended</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-52" />
          ) : (
            <WeeklyChart weeklyData={weeklyData} subjects={subjects} />
          )}
        </div>

        {/* Today's Quick Log */}
        <div className="bg-card border border-border rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Today's Log</h2>
            <Link to="/attendance" className="text-xs text-primary hover:underline">
              Full view →
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <TodayQuickLog
              subjects={subjects}
              todayRecords={todayRecords}
              onRefresh={refresh}
            />
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
