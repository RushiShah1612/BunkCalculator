import { useState, useEffect } from "react"
import { PageWrapper } from "../components/layout/PageWrapper"
import { useAuthStore } from "../store/authStore"
import { useSubjectStore } from "../store/subjectStore"
import { supabase } from "../lib/supabase"
import { useToastStore } from "../store/toastStore"
import { generateCSV, downloadCSV } from "../lib/analyticsHelpers"
import { ConfirmDialog } from "../components/shared/ConfirmDialog"
import { Button } from "../components/ui/button"
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  BellOff,
  Archive,
  Download,
  Palette,
  SlidersHorizontal,
  ShieldCheck,
  Save,
} from "lucide-react"

// ─── Theme Management ─────────────────────────────────────────────────────────

type Theme = "light" | "dark" | "system"

function getStoredTheme(): Theme {
  return (localStorage.getItem("theme") as Theme) ?? "system"
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === "dark") {
    root.classList.add("dark")
  } else if (theme === "light") {
    root.classList.remove("dark")
  } else {
    // system
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.toggle("dark", isDark)
  }
  localStorage.setItem("theme", theme)
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, profile } = useAuthStore()
  const { subjects } = useSubjectStore()
  const { toast } = useToastStore()

  useEffect(() => {
    document.title = "Settings | RollCall"
  }, [])

  // Theme
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)
  const changeTheme = (t: Theme) => {
    setThemeState(t)
    applyTheme(t)
  }

  // Default min attendance
  const [defaultMin, setDefaultMin] = useState(
    (profile as (typeof profile & { default_min_attendance?: number }) | null)
      ?.default_min_attendance ?? 75
  )
  const [savingMin, setSavingMin] = useState(false)

  const saveDefaultMin = async () => {
    if (!user) return
    setSavingMin(true)
    try {
      await supabase
        .from("profiles")
        .update({ default_min_attendance: defaultMin } as Record<string, unknown>)
        .eq("id", user.id)
      toast("Default updated!", "success")
    } catch {
      toast("Save failed", "error")
    } finally {
      setSavingMin(false)
    }
  }

  // Archive semester
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const handleArchiveSemester = async () => {
    setArchiving(true)
    try {
      const ids = subjects.map((s) => s.id)
      if (ids.length > 0) {
        await supabase
          .from("subjects")
          .update({ is_archived: true } as Record<string, unknown>)
          .in("id", ids)
      }
      toast("Semester archived! Start adding new subjects.", "success")
      setArchiveOpen(false)
      // Reload page to clear store
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      toast("Archive failed", "error")
    } finally {
      setArchiving(false)
    }
  }

  // Notifications
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission
    }
    return "default"
  })
  const [reminderTime, setReminderTime] = useState(
    localStorage.getItem("reminder-time") ?? "21:00"
  )

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      toast("Notifications not supported in this browser.", "error")
      return
    }
    const perm = await Notification.requestPermission()
    setNotifPermission(perm)
    if (perm === "granted") {
      toast("Notifications enabled!", "success")
      localStorage.setItem("reminder-time", reminderTime)
    } else {
      toast("Permission denied. Enable notifications in browser settings.", "error")
    }
  }

  const saveReminderTime = () => {
    localStorage.setItem("reminder-time", reminderTime)
    toast("Reminder time saved!", "success")
  }

  // Export all data
  const handleExportAll = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*, class_types!inner(subject_id, subjects!inner(user_id))")
        .eq("class_types.subjects.user_id", user.id)
        .order("date", { ascending: false })

      if (error) throw error
      const csv = generateCSV(data as import("../types").AttendanceRecord[], subjects)
      const date = new Date().toISOString().slice(0, 10)
      const name = profile?.full_name?.replace(/\s+/g, "_") ?? "student"
      downloadCSV(csv, `attendance_all_${name}_${date}.csv`)
      toast("Export ready!", "success")
    } catch {
      toast("Export failed", "error")
    }
  }

  return (
    <PageWrapper title="Settings">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Appearance ── */}
        <SectionCard icon={Palette} title="Appearance" subtitle="Customize how the app looks">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Color Theme
            </p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: "light", label: "Light", Icon: Sun },
                { value: "dark", label: "Dark", Icon: Moon },
                { value: "system", label: "System", Icon: Monitor },
              ] as const).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => changeTheme(value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    theme === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ── Attendance Defaults ── */}
        <SectionCard
          icon={SlidersHorizontal}
          title="Attendance Defaults"
          subtitle="Applied when creating new subjects"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Default Minimum Attendance
              </label>
              <span className="text-lg font-bold text-primary">{defaultMin}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={defaultMin}
              onChange={(e) => setDefaultMin(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>50%</span>
              <span>75% (standard)</span>
              <span>100%</span>
            </div>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={saveDefaultMin}
              disabled={savingMin}
            >
              <Save className="w-4 h-4 mr-1.5" />
              {savingMin ? "Saving…" : "Save Default"}
            </Button>
          </div>
        </SectionCard>

        {/* ── Semester Management ── */}
        <SectionCard
          icon={Archive}
          title="Semester Management"
          subtitle="Archive current semester and start fresh"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30">
              <div>
                <p className="text-sm font-medium text-foreground">Current Semester</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.semester || "Not set"} · {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => setArchiveOpen(true)}
              disabled={subjects.length === 0}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors text-left disabled:opacity-40"
            >
              <Archive className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  Archive Semester & Start New
                </p>
                <p className="text-xs text-muted-foreground">
                  Hides all current subjects. Your data remains in Analytics.
                </p>
              </div>
            </button>
          </div>
        </SectionCard>

        {/* ── Notifications ── */}
        <SectionCard
          icon={Bell}
          title="Notifications"
          subtitle="Browser reminders to log attendance"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
              {notifPermission === "granted" ? (
                <Bell className="w-5 h-5 text-green-500" />
              ) : notifPermission === "denied" ? (
                <BellOff className="w-5 h-5 text-red-500" />
              ) : (
                <Bell className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  Status:{" "}
                  <span
                    className={
                      notifPermission === "granted"
                        ? "text-green-500"
                        : notifPermission === "denied"
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }
                  >
                    {notifPermission === "granted"
                      ? "Enabled"
                      : notifPermission === "denied"
                      ? "Denied"
                      : "Not requested"}
                  </span>
                </p>
                {notifPermission === "denied" && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Go to browser Settings → Site Settings → Notifications to re-enable.
                  </p>
                )}
              </div>
            </div>

            {notifPermission !== "granted" && notifPermission !== "denied" && (
              <Button size="sm" className="rounded-xl" onClick={requestNotifications}>
                <Bell className="w-4 h-4 mr-1.5" />
                Enable Reminders
              </Button>
            )}

            {notifPermission === "granted" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Daily Reminder Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={saveReminderTime}>
                    <Save className="w-4 h-4 mr-1" /> Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll receive a browser notification at this time each day to log attendance.
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Data Management ── */}
        <SectionCard
          icon={ShieldCheck}
          title="Data Management"
          subtitle="Export or manage your data"
        >
          <div className="space-y-3">
            <button
              onClick={handleExportAll}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors text-left"
            >
              <Download className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Export All My Data</p>
                <p className="text-xs text-muted-foreground">Downloads full attendance CSV</p>
              </div>
            </button>
          </div>
        </SectionCard>
      </div>

      <ConfirmDialog
        isOpen={archiveOpen}
        title="Archive Current Semester?"
        description={`This will archive all ${subjects.length} subjects and their attendance records. They'll remain visible in Analytics under "Archived". You'll start fresh with no subjects.`}
        confirmLabel={archiving ? "Archiving…" : "Archive Semester"}
        onConfirm={handleArchiveSemester}
        onCancel={() => setArchiveOpen(false)}
        variant="destructive"
      />
    </PageWrapper>
  )
}
