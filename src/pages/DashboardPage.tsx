import { PageWrapper } from "../components/layout/PageWrapper"
import { 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  ArrowUpRight,
  Plus
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Link } from "react-router-dom"

export default function DashboardPage() {
  // Mock data for initial layout visualization
  const mockStats = {
    overallPercentage: 78.4,
    totalSubjects: 5,
    safeCount: 3,
    warningCount: 1,
    dangerCount: 1,
  }

  const mockSubjects = [
    { name: "Mathematics IV", code: "MATH301", percentage: 84.5, status: "safe", attendance: "22/26 hrs" },
    { name: "Database Management Systems", code: "CS402", percentage: 76.0, status: "warning", attendance: "19/25 hrs" },
    { name: "Operating Systems", code: "CS401", percentage: 68.2, status: "danger", attendance: "15/22 hrs" },
    { name: "Computer Networks", code: "CS403", percentage: 80.0, status: "safe", attendance: "20/25 hrs" },
    { name: "Software Engineering", code: "CS404", percentage: 88.0, status: "safe", attendance: "22/25 hrs" },
  ]

  return (
    <PageWrapper title="Dashboard">
      {/* Informative placeholder notice */}
      <div className="flex items-center space-x-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm mb-6 max-w-3xl animate-pulse">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div>
          <span className="font-semibold">Dashboard coming soon:</span> This screen is currently running in mock demo mode. Live data sync with Supabase PostgreSQL is planned in subsequent prompts.
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Overall Percentage */}
        <div className="col-span-2 bg-gradient-to-br from-primary to-purple-600 text-primary-foreground p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold uppercase tracking-wider text-white/70">
              Overall Attendance
            </span>
            <span className="bg-white/20 text-white text-[11px] px-2.5 py-1 rounded-full font-medium">
              Min 75%
            </span>
          </div>
          <div className="my-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              {mockStats.overallPercentage}%
            </h2>
            <div className="w-full bg-white/20 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-500" 
                style={{ width: `${mockStats.overallPercentage}%` }}
              ></div>
            </div>
          </div>
          <span className="text-xs text-white/80 flex items-center">
            Your attendance is overall on track <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </span>
        </div>

        {/* Subjects Card */}
        <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground font-semibold">Total</span>
          </div>
          <div className="my-2">
            <h3 className="text-3xl font-extrabold text-foreground">
              {mockStats.totalSubjects}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Courses Registered</p>
          </div>
          <Link to="/subjects" className="text-xs font-semibold text-primary hover:underline flex items-center">
            Manage Subjects <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        {/* Threshold Summary */}
        <div className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-safe/10 text-safe rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">Threshold Status</span>
          </div>
          <div className="space-y-2.5 my-3">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-safe mr-2"></span>
                Safe (75%+)
              </span>
              <span className="font-bold text-foreground">{mockStats.safeCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-warning mr-2"></span>
                Warning (70%-75%)
              </span>
              <span className="font-bold text-foreground">{mockStats.warningCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-danger mr-2"></span>
                Danger (&lt;70%)
              </span>
              <span className="font-bold text-foreground">{mockStats.dangerCount}</span>
            </div>
          </div>
          <Link to="/analytics" className="text-xs font-semibold text-primary hover:underline flex items-center">
            View Analytics <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* Main Section Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Progress Panel */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-foreground">Subject Wise Logs</h3>
            <Link to="/subjects">
              <Button size="sm" variant="outline" className="rounded-xl flex items-center space-x-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {mockSubjects.map((sub, index) => {
              const statusColors = {
                safe: "bg-safe text-safe-foreground border-safe/20",
                warning: "bg-warning text-warning-foreground border-warning/20",
                danger: "bg-danger text-danger-foreground border-danger/20",
              }

              return (
                <div 
                  key={index}
                  className="p-4 rounded-2xl border border-border bg-card/50 hover:bg-muted/10 transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {sub.code}
                      </span>
                      <h4 className="font-bold text-sm text-foreground md:text-base">
                        {sub.name}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-medium text-muted-foreground">
                        {sub.attendance}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${statusColors[sub.status as keyof typeof statusColors] || ""}`}>
                        {sub.percentage}%
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        sub.status === "safe" 
                          ? "bg-safe" 
                          : sub.status === "warning" 
                          ? "bg-warning" 
                          : "bg-danger"
                      }`}
                      style={{ width: `${sub.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick action card */}
        <div className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">Track Attendance</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mark present, absent, holiday, or cancelled status for today's lectures to keep records updated.
            </p>
          </div>
          
          <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs flex items-start space-x-2.5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>
              <strong>Attention:</strong> You are currently running low on attendance in <strong>Operating Systems (68.2%)</strong>. You need to attend 3 more classes to reach 75%.
            </span>
          </div>

          <Link to="/attendance">
            <Button className="w-full py-3 h-12 rounded-xl text-sm font-semibold shadow-lg hover:shadow-primary/10">
              Go to Logger
            </Button>
          </Link>
        </div>
      </div>
    </PageWrapper>
  )
}
