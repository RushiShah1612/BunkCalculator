import { PageWrapper } from "../components/layout/PageWrapper"
import { Plus, Info, Edit3, Trash2 } from "lucide-react"
import { Button } from "../components/ui/button"

export default function SubjectsPage() {
  const mockSubjects = [
    {
      id: "1",
      name: "Mathematics IV",
      code: "MATH301",
      credits: 4,
      semester: "Semester 4",
      color: "bg-blue-500",
      classTypes: [
        { name: "Theory", total: 40, min: 75 },
        { name: "Tutorial", total: 10, min: 75 }
      ]
    },
    {
      id: "2",
      name: "Database Management Systems",
      code: "CS402",
      credits: 4,
      semester: "Semester 4",
      color: "bg-emerald-500",
      classTypes: [
        { name: "Theory", total: 35, min: 75 },
        { name: "Lab", total: 15, min: 75 }
      ]
    },
    {
      id: "3",
      name: "Operating Systems",
      code: "CS401",
      credits: 3,
      semester: "Semester 4",
      color: "bg-red-500",
      classTypes: [
        { name: "Theory", total: 30, min: 75 },
        { name: "Lab", total: 12, min: 75 }
      ]
    }
  ]

  return (
    <PageWrapper title="Subjects">
      {/* Notice Banner */}
      <div className="flex items-center space-x-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm mb-6 max-w-3xl animate-pulse">
        <Info className="w-5 h-5 flex-shrink-0" />
        <div>
          <span className="font-semibold">Subjects page coming soon:</span> Add / Edit operations are running mock configs. Full Supabase DB connection is planned in subsequent prompts.
        </div>
      </div>

      {/* Header Panel */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Course Catalog</h2>
          <p className="text-sm text-muted-foreground">Manage your curriculum and class hours</p>
        </div>
        <Button className="rounded-xl flex items-center space-x-1 shadow-lg shadow-primary/10">
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </Button>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockSubjects.map((sub) => (
          <div
            key={sub.id}
            className="bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            {/* Header section with color tag */}
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2.5">
                  <span className={`w-3.5 h-3.5 rounded-full ${sub.color}`} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {sub.code || "No Code"}
                  </span>
                </div>
                <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                  {sub.credits} Credits
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 leading-snug line-clamp-1">
                {sub.name}
              </h3>
              <span className="text-xs text-muted-foreground">{sub.semester}</span>
            </div>

            {/* Class Types details */}
            <div className="px-6 py-4 border-t border-b border-border/60 bg-muted/10 space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Class Components
              </span>
              {sub.classTypes.map((type, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-foreground/80">{type.name}</span>
                  <span className="text-muted-foreground">
                    {type.total} total hrs · Min {type.min}%
                  </span>
                </div>
              ))}
            </div>

            {/* Actions Footer */}
            <div className="p-4 px-6 flex justify-end space-x-2 bg-card">
              <Button size="icon" variant="ghost" className="rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="rounded-xl hover:bg-danger/10 text-muted-foreground hover:text-danger">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  )
}
