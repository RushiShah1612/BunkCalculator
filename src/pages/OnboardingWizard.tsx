import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSubjects } from "../hooks/useSubjects"
import { useAuthStore } from "../store/authStore"
import {
  GraduationCap,
  BookOpen,
  CalendarCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { Button } from "../components/ui/button"

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current ? "bg-primary w-8" : i === current ? "bg-primary w-12" : "bg-muted w-8"
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground font-medium ml-1">
        {current + 1}/{total}
      </span>
    </div>
  )
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  const { profile } = useAuthStore()
  const name = profile?.full_name?.split(" ")[0] || "there"

  return (
    <div className="text-center space-y-8 py-6">
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/30">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-yellow-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-yellow-900" />
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Hey {name}! 👋
        </h1>
        <p className="text-lg text-muted-foreground font-medium">
          Welcome to <span className="text-primary font-bold">RollCall</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto text-left">
        {[
          { icon: BookOpen, label: "Track attendance per subject & class type" },
          { icon: CalendarCheck, label: "Get alerts before you hit danger zone" },
          { icon: CheckCircle2, label: "Simulate how many classes you can bunk" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-foreground font-medium">{label}</p>
          </div>
        ))}
      </div>

      <Button onClick={onNext} className="rounded-2xl px-8 py-3 h-12 text-base shadow-xl shadow-primary/20">
        Let's set up your tracker
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  )
}

// ─── Step 2: Add First Subject ────────────────────────────────────────────────

function StepAddSubject({
  onNext,
  onSkip,
  onSubjectCreated,
}: {
  onNext: () => void
  onSkip: () => void
  onSubjectCreated: (id: string) => void
}) {
  const { createSubject } = useSubjects()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    code: "",
    theoryHours: "45",
    labHours: "30",
    minAttendance: "75",
  })

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const classTypes = []
      if (Number(form.theoryHours) > 0) {
        classTypes.push({
          name: "Theory",
          total_hours: Number(form.theoryHours),
          hours_per_session: 1,
          min_attendance: Number(form.minAttendance),
        })
      }
      if (Number(form.labHours) > 0) {
        classTypes.push({
          name: "Lab",
          total_hours: Number(form.labHours),
          hours_per_session: 2,
          min_attendance: Number(form.minAttendance),
        })
      }

      const subject = await createSubject({
        name: form.name,
        code: form.code || null,
        color_tag: "#6366f1",
        credits: null,
        semester: null,
        class_types: classTypes,
      })

      if (subject) onSubjectCreated(subject.id)
      onNext()
    } catch {
      // error toasted by hook
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Add Your First Subject</h2>
        <p className="text-sm text-muted-foreground mt-1">
          You can always edit this or add more later
        </p>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Subject Name *
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Mathematics"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Subject Code
          </label>
          <input
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="e.g. MA301"
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Theory Hours
            </label>
            <input
              type="number"
              value={form.theoryHours}
              onChange={(e) => setForm((f) => ({ ...f, theoryHours: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Lab Hours
            </label>
            <input
              type="number"
              value={form.labHours}
              onChange={(e) => setForm((f) => ({ ...f, labHours: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Minimum Attendance: {form.minAttendance}%
          </label>
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={form.minAttendance}
            onChange={(e) => setForm((f) => ({ ...f, minAttendance: e.target.value }))}
            className="w-full accent-primary"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 max-w-sm mx-auto">
        <Button
          onClick={handleCreate}
          disabled={!form.name.trim() || saving}
          className="rounded-xl h-11"
        >
          {saving ? "Creating…" : <>Create Subject <ArrowRight className="w-4 h-4 ml-1.5" /></>}
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Go to Dashboard ──────────────────────────────────────────────────

function StepFinish({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="text-center space-y-8 py-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">You're all set! 🎉</h2>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          Your tracker is ready. Head to the dashboard to start logging attendance and monitoring your progress.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto text-left">
        {[
          "Add more subjects from the Subjects page",
          "Log attendance daily on the Attendance page",
          "View insights on the Analytics page",
        ].map((tip, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-primary font-bold shrink-0">{i + 1}.</span>
            {tip}
          </div>
        ))}
      </div>

      <Button
        onClick={onFinish}
        className="rounded-2xl px-8 py-3 h-12 text-base shadow-xl shadow-primary/20"
      >
        Go to Dashboard
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  )
}

// ─── Wizard Main ──────────────────────────────────────────────────────────────

const STEPS = 3

export default function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const [_createdSubjectId, setCreatedSubjectId] = useState<string | null>(null)
  const navigate = useNavigate()

  const finish = () => {
    localStorage.setItem("onboarding-done", "true")
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse delay-700" />

      <div className="w-full max-w-lg bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl">
        {/* Step bar */}
        <div className="mb-8">
          <StepBar current={step} total={STEPS} />
        </div>

        {/* Steps */}
        <div className="animate-in fade-in slide-in-from-right-2 duration-300" key={step}>
          {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
          {step === 1 && (
            <StepAddSubject
              onNext={() => setStep(2)}
              onSkip={() => setStep(2)}
              onSubjectCreated={(id) => setCreatedSubjectId(id)}
            />
          )}
          {step === 2 && <StepFinish onFinish={finish} />}
        </div>
      </div>
    </div>
  )
}
