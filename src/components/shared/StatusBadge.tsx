import type { AttendanceStatus } from "../../types"

interface StatusBadgeProps {
  status: AttendanceStatus
  size?: "sm" | "md"
}

const CONFIG: Record<
  AttendanceStatus,
  { label: string; className: string }
> = {
  PRESENT: {
    label: "Present",
    className:
      "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/40",
  },
  ABSENT: {
    label: "Absent",
    className:
      "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/40",
  },
  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700/40",
  },
  HOLIDAY: {
    label: "Holiday",
    className:
      "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/40",
  },
}

/**
 * Consistent status badge used across the app for attendance status display.
 */
export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const { label, className } = CONFIG[status]
  const sizeClass = size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]"

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-wide ${sizeClass} ${className}`}
    >
      {label}
    </span>
  )
}
