import { useState } from "react"
import { PageWrapper } from "../components/layout/PageWrapper"
import { CalendarCheck, Info, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../components/ui/button"

export default function AttendancePage() {
  const [selectedDate] = useState(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  })

  const mockSchedule = [
    { id: "1", subject: "Mathematics IV", type: "Theory", time: "09:00 AM - 10:00 AM", status: "PRESENT" },
    { id: "2", subject: "Database Management Systems", type: "Theory", time: "10:15 AM - 11:15 AM", status: "ABSENT" },
    { id: "3", subject: "Operating Systems", type: "Lab", time: "01:30 PM - 03:30 PM", status: null },
    { id: "4", subject: "Software Engineering", type: "Theory", time: "03:45 PM - 04:45 PM", status: null }
  ]

  const [statuses, setStatuses] = useState<Record<string, string | null>>({
    "1": "PRESENT",
    "2": "ABSENT",
    "3": null,
    "4": null
  })

  const handleStatusChange = (id: string, newStatus: string) => {
    setStatuses(prev => ({
      ...prev,
      [id]: prev[id] === newStatus ? null : newStatus
    }))
  }

  return (
    <PageWrapper title="Log Attendance">
      {/* Informative Banner */}
      <div className="flex items-center space-x-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm mb-6 max-w-3xl animate-pulse">
        <Info className="w-5 h-5 flex-shrink-0" />
        <div>
          <span className="font-semibold">Attendance logger coming soon:</span> Mark actions are visual-only stubs. Live Supabase database synchronization is planned in subsequent prompts.
        </div>
      </div>

      {/* Date Navigator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-card border border-border p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-foreground text-sm sm:text-base">
            {selectedDate}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="icon" variant="outline" className="rounded-xl h-9 w-9">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl h-9">
            Today
          </Button>
          <Button size="icon" variant="outline" className="rounded-xl h-9 w-9">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Schedule Listing */}
      <div className="bg-card border border-border rounded-3xl p-6 max-w-4xl">
        <h3 className="text-base font-bold text-foreground mb-4 uppercase tracking-wider text-muted-foreground pl-1">
          Today's Classes
        </h3>

        <div className="space-y-4">
          {mockSchedule.map((item) => {
            const currentStatus = statuses[item.id]

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-border/80 bg-card/40 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/20 transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {item.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                  <h4 className="font-bold text-foreground text-base">{item.subject}</h4>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(item.id, "PRESENT")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      currentStatus === "PRESENT"
                        ? "bg-safe text-safe-foreground border-safe"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleStatusChange(item.id, "ABSENT")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      currentStatus === "ABSENT"
                        ? "bg-danger text-danger-foreground border-danger"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    onClick={() => handleStatusChange(item.id, "CANCELLED")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      currentStatus === "CANCELLED"
                        ? "bg-yellow-500 text-black border-yellow-500"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    Cancelled
                  </button>
                  <button
                    onClick={() => handleStatusChange(item.id, "HOLIDAY")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      currentStatus === "HOLIDAY"
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    Holiday
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Save button stub */}
        <div className="mt-8 flex justify-end">
          <Button className="px-6 py-2.5 h-11 rounded-xl text-sm font-semibold shadow-lg shadow-primary/10">
            Save Records
          </Button>
        </div>
      </div>
    </PageWrapper>
  )
}
