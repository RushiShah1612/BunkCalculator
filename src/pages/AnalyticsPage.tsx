import { PageWrapper } from "../components/layout/PageWrapper"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts"
import { BarChart3, Info, AlertTriangle, TrendingUp } from "lucide-react"

export default function AnalyticsPage() {
  // Mock data for Recharts visualizations
  const barChartData = [
    { name: "MATH301", current: 84.5, required: 75 },
    { name: "CS402", current: 76.0, required: 75 },
    { name: "CS401", current: 68.2, required: 75 },
    { name: "CS403", current: 80.0, required: 75 },
    { name: "CS404", current: 88.0, required: 75 }
  ]

  const lineChartData = [
    { week: "Wk 1", attendance: 90 },
    { week: "Wk 2", attendance: 88 },
    { week: "Wk 3", attendance: 82 },
    { week: "Wk 4", attendance: 75 },
    { week: "Wk 5", attendance: 78.4 }
  ]

  return (
    <PageWrapper title="Analytics & Insights">
      {/* Notice Banner */}
      <div className="flex items-center space-x-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm mb-6 max-w-3xl animate-pulse">
        <Info className="w-5 h-5 flex-shrink-0" />
        <div>
          <span className="font-semibold">Analytics coming soon:</span> These charts represent mock insights. Real-time metrics calculations with live Database records is planned in subsequent prompts.
        </div>
      </div>

      {/* Grid containing charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Course Wise Attendance Chart */}
        <div className="bg-card border border-border p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Course-wise Attendance</h3>
              <p className="text-xs text-muted-foreground">Current percentage vs required 75% threshold</p>
            </div>
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.922 0 0 / 20%)" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "oklch(var(--card))", 
                    borderColor: "oklch(var(--border))",
                    borderRadius: "12px",
                    color: "oklch(var(--foreground))"
                  }} 
                />
                <Bar dataKey="current" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Progression Chart */}
        <div className="bg-card border border-border p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground">Semester Progression</h3>
              <p className="text-xs text-muted-foreground">Weekly cumulative attendance rate</p>
            </div>
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.922 0 0 / 20%)" />
                <XAxis dataKey="week" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={[50, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "oklch(var(--card))", 
                    borderColor: "oklch(var(--border))",
                    borderRadius: "12px",
                    color: "oklch(var(--foreground))"
                  }} 
                />
                <Line type="monotone" dataKey="attendance" stroke="rgb(124, 58, 237)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Warning analysis summary */}
      <div className="bg-card border border-border p-6 rounded-3xl max-w-3xl">
        <h4 className="font-bold text-foreground mb-4">Critical Summary</h4>
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 rounded-2xl bg-danger/5 border border-danger/10 text-danger text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <span className="font-bold block mb-0.5">Danger Warning: Operating Systems (CS401)</span>
              Your current attendance is 68.2%. The absolute maximum attendance percentage you can achieve if you attend every remaining lecture this semester is <strong>73.4%</strong>. You are locked out of achieving the 75% attendance threshold unless you can procure an official medical leave waiver.
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <span className="font-bold block mb-0.5">Alert Warning: Database Management (CS402)</span>
              Your current attendance is 76.0%. You have exactly <strong>0 safe bunks</strong> left. Bunking any upcoming session will instantly push your attendance below 75%.
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
