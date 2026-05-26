import { useEffect } from "react"
import { useNotificationStore } from "../store/notificationStore"
import type { SubjectWithStats } from "./useDashboardData"

/**
 * Hook to automatically generate intelligent contextual notifications based on subject statistics.
 * Checks for:
 * 1. Danger alerts (attendance below min requirement)
 * 2. Warning alerts (attendance close to min requirement, within 5%)
 * 3. Bunk milestones (user has safe bunks available)
 *
 * Prevents duplicates by checking if a similar notification was generated in the last 24 hours.
 */
export function useNotificationAlerts(subjectStats: SubjectWithStats[]) {
  const { notifications, addNotification } = useNotificationStore()

  useEffect(() => {
    if (!subjectStats || subjectStats.length === 0) return

    const now = new Date().getTime()
    const oneDayMs = 24 * 60 * 60 * 1000

    subjectStats.forEach((stat) => {
      const { subject, overallPct, overallStatus, totalSafeBunks } = stat
      const minAttendance = subject.min_attendance ?? 75

      // 1. Danger Alert
      if (overallStatus === "danger" || overallPct < minAttendance) {
        const title = `Attendance Danger: ${subject.name}`
        const exists = notifications.some(
          (n) => n.title === title && now - new Date(n.createdAt).getTime() < oneDayMs
        )

        if (!exists) {
          addNotification({
            type: "danger",
            title,
            message: `Your overall attendance is ${overallPct.toFixed(1)}%, which is below your target of ${minAttendance}%. Please attend your upcoming classes!`,
          })
        }
      }
      // 2. Warning Alert
      else if (overallStatus === "warning" || (overallPct >= minAttendance && overallPct < minAttendance + 5)) {
        const title = `Attendance Warning: ${subject.name}`
        const exists = notifications.some(
          (n) => n.title === title && now - new Date(n.createdAt).getTime() < oneDayMs
        )

        if (!exists) {
          addNotification({
            type: "warning",
            title,
            message: `Your attendance is at ${overallPct.toFixed(1)}% (Target: ${minAttendance}%). You are currently close to the detention margin.`,
          })
        }
      }
      // 3. Safe Bunk Milestone
      else if (totalSafeBunks > 0) {
        const title = `Safe Bunks Available: ${subject.name}`
        const exists = notifications.some(
          (n) => n.title === title && now - new Date(n.createdAt).getTime() < oneDayMs
        )

        if (!exists) {
          addNotification({
            type: "success",
            title,
            message: `Great news! You have a safe buffer of ${totalSafeBunks} class${totalSafeBunks > 1 ? "es" : ""} that you can bunk for ${subject.name}.`,
          })
        }
      }
    })
  }, [subjectStats, notifications, addNotification])
}
