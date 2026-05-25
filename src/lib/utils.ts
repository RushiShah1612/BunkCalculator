import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AttendanceRecord } from "../types"

// ─── Shadcn helper ───────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── formatPercentage ────────────────────────────────────────────────────────

/**
 * Formats a numeric percentage value as a display string with two decimal places.
 *
 * @param value - The numeric percentage (e.g. 75.5)
 * @returns Formatted string (e.g. "75.50%")
 *
 * @example
 * formatPercentage(75.5)   // → "75.50%"
 * formatPercentage(100)    // → "100.00%"
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

// ─── getStatusColor ───────────────────────────────────────────────────────────

/**
 * Returns a Tailwind CSS text-color class for a given attendance status.
 *
 * @param status - "safe" | "warning" | "danger"
 * @returns Tailwind class string for text color
 *
 * @example
 * getStatusColor("safe")    // → "text-safe"
 * getStatusColor("danger")  // → "text-danger"
 */
export function getStatusColor(
  status: "safe" | "warning" | "danger"
): string {
  switch (status) {
    case "safe":    return "text-safe"
    case "warning": return "text-warning"
    case "danger":  return "text-danger"
  }
}

// ─── getStatusBgColor ────────────────────────────────────────────────────────

/**
 * Returns a Tailwind CSS background-color class for a given attendance status.
 *
 * @param status - "safe" | "warning" | "danger"
 * @returns Tailwind class string for background color
 *
 * @example
 * getStatusBgColor("warning")  // → "bg-warning/10"
 */
export function getStatusBgColor(
  status: "safe" | "warning" | "danger"
): string {
  switch (status) {
    case "safe":    return "bg-safe/10"
    case "warning": return "bg-warning/10"
    case "danger":  return "bg-danger/10"
  }
}

// ─── formatHours ──────────────────────────────────────────────────────────────

/**
 * Formats a numeric hour count as a display string, dropping the decimal if
 * the value is a whole number.
 *
 * @param hours - Hour value (e.g. 45 or 45.5)
 * @returns Formatted string (e.g. "45 hrs" or "45.5 hrs")
 *
 * @example
 * formatHours(45)    // → "45 hrs"
 * formatHours(45.5)  // → "45.5 hrs"
 */
export function formatHours(hours: number): string {
  const display = hours % 1 === 0 ? hours.toString() : hours.toString()
  return `${display} hrs`
}

// ─── getDatesInRange ──────────────────────────────────────────────────────────

/**
 * Returns an array of Date objects for every calendar day between `start` and
 * `end` inclusive (in chronological order).
 *
 * @param start - Start date (inclusive)
 * @param end   - End date (inclusive)
 * @returns Array of Date objects, one per day
 *
 * @example
 * getDatesInRange(new Date("2024-01-01"), new Date("2024-01-03"))
 * // → [Date("2024-01-01"), Date("2024-01-02"), Date("2024-01-03")]
 */
export function getDatesInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const endNorm = new Date(end)
  endNorm.setHours(0, 0, 0, 0)

  while (cursor <= endNorm) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

// ─── isToday ──────────────────────────────────────────────────────────────────

/**
 * Checks whether a date string (ISO format) represents today's date.
 *
 * @param dateString - ISO date string (e.g. "2024-05-25" or full ISO timestamp)
 * @returns `true` if the date is today, `false` otherwise
 *
 * @example
 * isToday("2024-05-25")  // → true or false depending on current date
 */
export function isToday(dateString: string): boolean {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  return dateString.slice(0, 10) === todayStr
}

// ─── groupRecordsByDate ───────────────────────────────────────────────────────

/**
 * Groups an array of AttendanceRecord objects by their calendar date (YYYY-MM-DD).
 *
 * @param records - Array of AttendanceRecord objects
 * @returns An object mapping date strings to arrays of records on that date
 *
 * @example
 * groupRecordsByDate(records)
 * // → { "2024-05-25": [record1, record2], "2024-05-26": [record3] }
 */
export function groupRecordsByDate(
  records: AttendanceRecord[]
): Record<string, AttendanceRecord[]> {
  return records.reduce<Record<string, AttendanceRecord[]>>((acc, record) => {
    const day = record.date.slice(0, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(record)
    return acc
  }, {})
}
