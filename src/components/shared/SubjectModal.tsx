import { useEffect } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, X, AlertCircle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import type { Subject } from "../../types"

// 12 Preset Colors
const PRESET_COLORS = [
  { name: "indigo", hex: "#6366f1" },
  { name: "blue", hex: "#3b82f6" },
  { name: "green", hex: "#22c55e" },
  { name: "yellow", hex: "#eab308" },
  { name: "red", hex: "#ef4444" },
  { name: "purple", hex: "#a855f7" },
  { name: "pink", hex: "#ec4899" },
  { name: "orange", hex: "#f97316" },
  { name: "teal", hex: "#14b8a6" },
  { name: "cyan", hex: "#06b6d4" },
  { name: "rose", hex: "#f43f5e" },
  { name: "slate", hex: "#64748b" },
]

const classTypeFormSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "Type name is required"),
    customName: z.string().optional(),
    total_hours: z.coerce.number().min(1, "Must be > 0"),
    hours_per_session: z.coerce.number().min(0.5, "Must be >= 0.5"),
    timetable_days: z.array(z.string()).default([]),
  })
  .refine((data) => data.hours_per_session <= data.total_hours, {
    message: "Session hours exceed total",
    path: ["hours_per_session"],
  })

const subjectFormSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional(),
  credits: z.coerce.number().optional(),
  semester: z.string().optional(),
  color_tag: z.string().min(1, "Color tag is required"),
  min_attendance: z.coerce.number().min(1, "Must be >= 1").max(100, "Max 100"),
  class_types: z.array(classTypeFormSchema).min(1, "At least one class type is required"),
})

type SubjectFormValues = z.infer<typeof subjectFormSchema>

interface SubjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: unknown) => Promise<unknown>
  subject?: Subject | null // If present, we are in Edit mode
  loading: boolean
}

export function SubjectModal({ isOpen, onClose, onSubmit, subject, loading }: SubjectModalProps) {
  const isEdit = !!subject

  const {
    register: registerField,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: "",
      code: "",
      credits: undefined,
      semester: "",
      color_tag: PRESET_COLORS[0].hex,
      min_attendance: 75,
      class_types: [
        {
          name: "Theory",
          customName: "",
          total_hours: 45,
          hours_per_session: 1,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "class_types",
  })

  const watchedClassTypes = useWatch({
    control,
    name: "class_types",
    defaultValue: fields
  })

  // Watch form fields for the real-time Summary Box calculation
  const watchClassTypes = watchedClassTypes
  const watchColor = useWatch({ control, name: "color_tag" })

  // Fill form when subject changes (Edit vs Create mode)
  useEffect(() => {
    if (isOpen) {
      if (subject) {
        reset({
          name: subject.name,
          code: subject.code || "",
          credits: subject.credits || undefined,
          semester: subject.semester || "",
          color_tag: subject.color_tag,
          min_attendance: subject.min_attendance ?? 75,
          class_types: subject.class_types.map((ct) => {
            const isStandard = ["Theory", "Lab", "Tutorial", "Seminar", "Project"].includes(ct.name)
            return {
              id: ct.id,
              name: isStandard ? ct.name : "Custom",
              customName: isStandard ? "" : ct.name,
              total_hours: Number(ct.total_hours),
              hours_per_session: Number(ct.hours_per_session),
              timetable_days: ct.timetable_days || [],
            }
          }),
        })
      } else {
        reset({
          name: "",
          code: "",
          credits: undefined,
          semester: "",
          color_tag: PRESET_COLORS[0].hex,
          min_attendance: 75,
          class_types: [
            {
              name: "Theory",
              customName: "",
              total_hours: 45,
              hours_per_session: 1,
              timetable_days: [],
            },
          ],
        })
      }
    }
  }, [subject, isOpen, reset])

  const onFormSubmit = async (data: SubjectFormValues) => {
    // Format Class Types custom name mappings
    const formattedClassTypes = data.class_types.map((ct) => ({
      id: ct.id,
      name: ct.name === "Custom" ? ct.customName || "Custom" : ct.name,
      total_hours: ct.total_hours,
      hours_per_session: ct.hours_per_session,
      timetable_days: ct.timetable_days || [],
    }))

    const payload = {
      ...data,
      credits: data.credits || null,
      code: data.code || null,
      semester: data.semester || null,
      min_attendance: data.min_attendance,
      class_types: formattedClassTypes,
    }

    try {
      await onSubmit(payload)
      onClose()
    } catch (err) {
      console.error("Subject form submission error:", err)
    }
  }

  // Calculate stats for Summary Box
  const summaryTotalHours = watchClassTypes.reduce(
    (acc, ct) => acc + (Number(ct.total_hours) || 0),
    0
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-2xl w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-3xl border-none sm:border bg-card p-0 shadow-2xl flex flex-col">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border flex flex-row justify-between items-center">
          <DialogTitle className="text-xl font-bold text-foreground">
            {isEdit ? "Edit Subject" : "Add Subject"}
          </DialogTitle>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SECTION A — Subject Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">
              Section A — Subject Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 pl-1">
                  Subject Name*
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics IV"
                  {...registerField("name")}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                    errors.name ? "border-danger focus:ring-danger/50" : "border-border"
                  }`}
                />
                {errors.name && (
                  <span className="text-xs text-danger mt-1 block pl-1">
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 pl-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. MATH301"
                  {...registerField("code")}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 pl-1">
                  Credits
                </label>
                <input
                  type="number"
                  placeholder="e.g. 4"
                  {...registerField("credits")}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 pl-1">
                  Semester
                </label>
                <input
                  type="text"
                  placeholder="e.g. Semester 4"
                  {...registerField("semester")}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 pl-1">
                  Minimum Required Attendance (%) *
                </label>
                <input
                  type="number"
                  placeholder="75"
                  {...registerField("min_attendance")}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                    errors.min_attendance ? "border-danger focus:ring-danger/50" : "border-border"
                  }`}
                />
                {errors.min_attendance && (
                  <span className="text-xs text-danger mt-1 block pl-1">
                    {errors.min_attendance.message}
                  </span>
                )}
              </div>
            </div>

            {/* Color Swatch Picker */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pl-1">
                Color Tag*
              </label>
              <div className="flex flex-wrap gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setValue("color_tag", color.hex)}
                    className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                      watchColor === color.hex
                        ? "border-foreground scale-110 shadow-md"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {watchColor === color.hex && (
                      <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-border/60" />

          {/* SECTION B — Dynamic Class Types */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pl-1">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Section B — Class Types
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  append({
                    name: "Theory",
                    customName: "",
                    total_hours: 30,
                    hours_per_session: 1,
                    timetable_days: [],
                  })
                }
                className="rounded-xl flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Class Type</span>
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => {
                const currentClassType = watchedClassTypes[index] || field
                const watchName = currentClassType.name
                const watchHours = currentClassType.total_hours || 0
                const watchSessionHours = currentClassType.hours_per_session || 1
                
                // Sessions expected = totalHours / hoursPerSession
                const expectedSessions = 
                  watchHours > 0 && watchSessionHours > 0 
                    ? Math.round((watchHours / watchSessionHours) * 100) / 100 
                    : 0

                const rowErrors = errors.class_types?.[index]

                return (
                  <div
                    key={field.id}
                    className="p-4 rounded-2xl border border-border/80 bg-background/30 space-y-4 relative"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                      {/* Name Selector */}
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 pl-1">
                          Class Component
                        </label>
                        <select
                          {...registerField(`class_types.${index}.name`)}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="Theory">Theory</option>
                          <option value="Lab">Lab</option>
                          <option value="Tutorial">Tutorial</option>
                          <option value="Seminar">Seminar</option>
                          <option value="Project">Project</option>
                          <option value="Custom">Custom...</option>
                        </select>
                      </div>

                      {/* Total Hours */}
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 pl-1">
                          Total Hours
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 45"
                          {...registerField(`class_types.${index}.total_hours`)}
                          className={`w-full px-3 py-1.5 rounded-xl border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                            rowErrors?.total_hours ? "border-danger focus:ring-danger/50" : "border-border"
                          }`}
                        />
                      </div>

                      {/* Hours per Session */}
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 pl-1">
                          Hrs / Session
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="e.g. 1"
                          {...registerField(`class_types.${index}.hours_per_session`)}
                          className={`w-full px-3 py-1.5 rounded-xl border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                            rowErrors?.hours_per_session ? "border-danger focus:ring-danger/50" : "border-border"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Custom Name text field */}
                    {watchName === "Custom" && (
                      <div className="max-w-xs animate-in fade-in duration-200">
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 pl-1">
                          Custom Component Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Workshop"
                          {...registerField(`class_types.${index}.customName`)}
                          className={`w-full px-3 py-1.5 rounded-xl border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                            rowErrors?.customName ? "border-danger focus:ring-danger/50" : "border-border"
                          }`}
                        />
                      </div>
                    )}

                    {/* Timetable Days Selector */}
                    <div className="space-y-1.5 pl-1">
                      <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Timetable Days (Scheduled Days)
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                          const currentDays = (watchedClassTypes[index] || field).timetable_days || []
                          const isSelected = currentDays.includes(day)
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const updatedDays = isSelected
                                  ? currentDays.filter((d: string) => d !== day)
                                  : [...currentDays, day]
                                setValue(`class_types.${index}.timetable_days`, updatedDays, { shouldValidate: true })
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                isSelected
                                  ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
                                  : "bg-muted/40 border border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Extra Session expectation calculation info */}
                    <div className="flex justify-between items-center text-[10px] font-medium text-muted-foreground pl-1">
                      <span>
                        = {expectedSessions} total sessions expected
                      </span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-danger hover:underline flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Component</span>
                        </button>
                      )}
                    </div>

                    {/* Render error summaries for the row */}
                    {(rowErrors?.total_hours || rowErrors?.hours_per_session) && (
                      <div className="p-2 rounded-xl bg-danger/5 text-[10px] text-danger flex items-start space-x-1 pl-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <div>
                          {rowErrors?.total_hours?.message && <p>· Total hours: {rowErrors?.total_hours?.message}</p>}
                          {rowErrors?.hours_per_session?.message && <p>· Hrs/Session: {rowErrors?.hours_per_session?.message}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dynamic Summary Box */}
          <div className="p-4 rounded-2xl border border-border bg-muted/30 space-y-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Summary Preview
            </h4>
            <div className="text-xs text-muted-foreground space-y-1 pl-1">
              <p className="font-semibold text-foreground">
                Total Semester Hours: {summaryTotalHours} hrs
              </p>
              {watchClassTypes.map((ct, idx) => {
                const nameDisplay = ct.name === "Custom" ? ct.customName || "Custom" : ct.name
                const sessions = 
                  ct.total_hours && ct.hours_per_session 
                    ? Math.round((ct.total_hours / ct.hours_per_session) * 100) / 100 
                    : 0
                return (
                  <p key={idx} className="list-disc pl-2">
                    · {nameDisplay || "Component"}: {ct.total_hours || 0} hrs ({sessions} sessions)
                  </p>
                )
              })}
            </div>
          </div>

          {/* Footer controls */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl shadow-lg px-6 flex items-center space-x-1"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              <span>{isEdit ? "Update Subject" : "Add Subject"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
