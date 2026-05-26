import { useEffect, useState, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { GraduationCap, Calendar, Share2, AlertCircle, ArrowLeft, Check, BookOpen } from "lucide-react"
import { Button } from "../components/ui/button"
import { LoadingSpinner } from "../components/shared/LoadingSpinner"

interface SubjectReportItem {
  name: string
  code: string | null
  color: string
  percentage: number
  classTypes: {
    name: string
    percentage: number
    attended: number
    total: number
  }[]
}

interface SharedReportData {
  studentName: string
  semester: string
  overallAttendance: number
  subjects: SubjectReportItem[]
}

export default function SharedReportPage() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<SharedReportData | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchReport = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from("shared_reports")
        .select("*")
        .eq("id", id)
        .single()

      if (fetchError) throw fetchError
      if (!data) {
        setError("Report not found.")
        return
      }

      // Check expiry
      const expiry = new Date(data.expires_at)
      if (new Date() > expiry) {
        setError("This shared report has expired. Reports are only valid for 7 days.")
        return
      }

      setReport(data.report_data as SharedReportData)
      setExpiresAt(data.expires_at)
    } catch (err: unknown) {
      console.error(err)
      const errorMsg = err instanceof Error ? err.message : "Failed to load report."
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    document.title = "Shared Attendance Report | RollCall"
    const timer = setTimeout(() => {
      fetchReport()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchReport])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy", err)
    }
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Loading shared report..." />
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 text-center space-y-6 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Unable to View Report</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{error || "Report not found"}</p>
          </div>
          <Link to="/login" className="block">
            <Button className="w-full rounded-xl">Go to RollCall Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  const expiryDateFormatted = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : ""

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      {/* Background blobs for premium layout */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto space-y-6 relative">
        {/* Back Link */}
        <Link to="/login" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors gap-1.5 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Go to RollCall App
        </Link>

        {/* ── Header ── */}
        <div className="bg-card border border-border rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Attendance Report</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Student: <span className="font-semibold text-foreground">{report.studentName}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Semester: <span className="font-semibold text-foreground">{report.semester}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:items-end gap-3 shrink-0">
            {/* Overall Attendance Stat Card */}
            <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 text-center sm:text-left">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overall Attendance</p>
              <p className={`text-3xl font-black mt-1 ${
                report.overallAttendance >= 75 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}>
                {report.overallAttendance.toFixed(1)}%
              </p>
            </div>

            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="rounded-xl h-11 px-4 gap-2 font-semibold shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500 animate-in zoom-in-50" />
                  Copied URL
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-primary" />
                  Share Link
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── Expiration Alert Banner ── */}
        <div className="bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-2xl p-4 flex items-center gap-2.5 shadow-sm">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Report valid until: <strong>{expiryDateFormatted}</strong> (expires in 7 days from creation)</span>
        </div>

        {/* ── Subject Breakdown list ── */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl p-6">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-6">
            <BookOpen className="w-4 h-4 text-primary" />
            Subject Wise Stats
          </h2>

          <div className="space-y-4">
            {report.subjects.map((sub) => (
              <div
                key={sub.name}
                className="border border-border/50 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-muted/10 hover:bg-muted/20 transition-all duration-200"
              >
                {/* Subject Name & Color */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: sub.color }}
                  />
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{sub.name}</h3>
                    {sub.code && <p className="text-xs text-muted-foreground">{sub.code}</p>}
                  </div>
                </div>

                {/* Subclass types stats list */}
                <div className="flex-1 md:max-w-md flex flex-wrap gap-4 justify-start md:justify-end text-xs">
                  {sub.classTypes.map((ct) => (
                    <div key={ct.name} className="bg-card border border-border/50 rounded-xl px-3.5 py-2 min-w-[100px] text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{ct.name}</p>
                      <p className="font-bold text-foreground mt-0.5">{ct.percentage.toFixed(0)}%</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {ct.attended}/{ct.total} hrs
                      </p>
                    </div>
                  ))}
                </div>

                {/* Overall Subject Percentage */}
                <div className="text-right border-t border-border/40 pt-3 md:pt-0 md:border-0 shrink-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Subject %</p>
                  <p className={`text-xl font-extrabold mt-0.5 ${
                    sub.percentage >= 75 ? "text-green-600 dark:text-green-400" : "text-red-500"
                  }`}>
                    {sub.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-muted-foreground py-6">
          Powered by <span className="text-primary font-semibold">RollCall Attendance Tracker</span>
        </div>
      </div>
    </div>
  )
}
