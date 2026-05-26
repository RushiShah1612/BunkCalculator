import { supabase } from "./supabase"

/**
 * Seeds realistic demo data for a user to experience the app.
 * Creates 4 subjects: Mathematics, Physics, Data Structures, English.
 * Populates each with class types and weekday attendance records over the last 60 days.
 * The overall presence rate is targeted at ~80%.
 */
export async function seedDemoData(userId: string) {
  // 1. Insert 4 subjects
  const subjectsData = [
    { name: "Mathematics", code: "MA101", color_tag: "#6366f1", credits: 4, semester: "Semester 1", user_id: userId },
    { name: "Physics", code: "PH101", color_tag: "#ec4899", credits: 3, semester: "Semester 1", user_id: userId },
    { name: "Data Structures", code: "CS101", color_tag: "#10b981", credits: 4, semester: "Semester 1", user_id: userId },
    { name: "English", code: "EN101", color_tag: "#f59e0b", credits: 2, semester: "Semester 1", user_id: userId },
  ]

  const { data: insertedSubjects, error: subjectsError } = await supabase
    .from("subjects")
    .insert(subjectsData)
    .select()

  if (subjectsError) throw subjectsError
  if (!insertedSubjects) throw new Error("No subjects inserted")

  // Find subjects by name to get correct IDs
  const math = insertedSubjects.find(s => s.name === "Mathematics")!
  const phys = insertedSubjects.find(s => s.name === "Physics")!
  const ds = insertedSubjects.find(s => s.name === "Data Structures")!
  const eng = insertedSubjects.find(s => s.name === "English")!

  // 2. Insert class types for each subject
  const classTypesData = [
    { subject_id: math.id, name: "Theory", total_hours: 45, hours_per_session: 1, min_attendance: 75, timetable_days: ["Monday", "Wednesday"] },
    { subject_id: math.id, name: "Tutorial", total_hours: 15, hours_per_session: 1, min_attendance: 75, timetable_days: ["Tuesday"] },
    { subject_id: phys.id, name: "Theory", total_hours: 30, hours_per_session: 1, min_attendance: 75, timetable_days: ["Monday", "Thursday"] },
    { subject_id: phys.id, name: "Lab", total_hours: 30, hours_per_session: 2, min_attendance: 75, timetable_days: ["Friday"] },
    { subject_id: ds.id, name: "Theory", total_hours: 45, hours_per_session: 1, min_attendance: 75, timetable_days: ["Wednesday", "Friday"] },
    { subject_id: ds.id, name: "Lab", total_hours: 30, hours_per_session: 2, min_attendance: 75, timetable_days: ["Tuesday"] },
    { subject_id: eng.id, name: "Theory", total_hours: 30, hours_per_session: 1, min_attendance: 75, timetable_days: ["Tuesday", "Thursday"] },
  ]

  const { data: insertedClassTypes, error: ctError } = await supabase
    .from("class_types")
    .insert(classTypesData)
    .select()

  if (ctError) throw ctError
  if (!insertedClassTypes) throw new Error("No class types inserted")

  // 3. Generate 60 days of attendance records
  // Random weekday records: ~80% PRESENT, ~15% ABSENT, ~5% CANCELLED
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const records = []
  const now = new Date()

  for (let i = 60; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const dayOfWeek = d.getDay()

    // Weekends have no classes
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    const dateStr = d.toISOString().slice(0, 10)
    const currentDayName = daysOfWeek[dayOfWeek]

    for (const ct of insertedClassTypes) {
      const scheduledDays = (ct.timetable_days as string[]) || []
      // Verify if this class type is scheduled for the day of the week
      if (scheduledDays.includes(currentDayName)) {
        const rand = Math.random()
        const status = rand < 0.82 ? "PRESENT" : rand < 0.96 ? "ABSENT" : "CANCELLED"
        records.push({
          class_type_id: ct.id,
          user_id: userId,
          date: dateStr,
          status,
          notes: status === "CANCELLED" ? "Professor absent" : null,
        })
      }
    }
  }

  // Insert records in batches of 100 to prevent hitting Supabase constraints
  if (records.length > 0) {
    const batchSize = 100
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const { error: recordsError } = await supabase
        .from("attendance_records")
        .insert(batch)
      if (recordsError) throw recordsError
    }
  }
}

/**
 * Clears demo subjects and cascaded data (class types, records) for a user.
 */
export async function clearDemoData(userId: string) {
  // Delete all subjects that match our seeded list
  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("user_id", userId)
    .in("name", ["Mathematics", "Physics", "Data Structures", "English"])

  if (error) throw error
}
