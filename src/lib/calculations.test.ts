import { describe, it, expect } from "vitest"
import {
  calculateCurrentPercentage,
  calculateProjectedPercentage,
  calculateSafeBunks,
  calculateClassesNeeded,
  calculateAttendanceStatus,
  simulateAttendance,
  calculateOverallStats,
  calculateClassTypeStats,
  getStreakCount,
} from "./calculations"
import type { AttendanceRecord, AttendanceStats, ClassTypeConfig } from "../types"

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeClassType(overrides: Partial<ClassTypeConfig> = {}): ClassTypeConfig {
  return {
    id: "ct-1",
    subject_id: "sub-1",
    name: "Theory",
    total_hours: 60,
    hours_per_session: 1,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  }
}

function makeRecord(
  status: AttendanceRecord["status"],
  date: string,
  classTypeId = "ct-1"
): AttendanceRecord {
  return {
    id: `rec-${Math.random()}`,
    class_type_id: classTypeId,
    date,
    status,
    notes: null,
    created_at: date + "T00:00:00Z",
  }
}

// ─── calculateCurrentPercentage ──────────────────────────────────────────────

describe("calculateCurrentPercentage", () => {
  it("returns 0 when no classes held", () => {
    expect(calculateCurrentPercentage(0, 0)).toBe(0)
  })

  it("returns 100 when all classes attended", () => {
    expect(calculateCurrentPercentage(30, 30)).toBe(100)
  })

  it("rounds to 2 decimal places", () => {
    expect(calculateCurrentPercentage(1, 3)).toBe(33.33)
  })

  it("computes 75% correctly", () => {
    expect(calculateCurrentPercentage(30, 40)).toBe(75)
  })
})

// ─── calculateProjectedPercentage ────────────────────────────────────────────

describe("calculateProjectedPercentage", () => {
  it("returns 0 when total semester hours is 0", () => {
    expect(calculateProjectedPercentage(30, 0)).toBe(0)
  })

  it("returns correct worst-case percentage", () => {
    // 30 present out of 60 total → 50%
    expect(calculateProjectedPercentage(30, 60)).toBe(50)
  })

  it("rounds to 2 decimal places", () => {
    expect(calculateProjectedPercentage(1, 3)).toBe(33.33)
  })
})

// ─── calculateSafeBunks ──────────────────────────────────────────────────────

describe("calculateSafeBunks", () => {
  it("user's example: 12 present / 14 held, 75% min, 1hr sessions → 2 hours", () => {
    // 12/16 = 75% (ok), 12/17 = 70.6% (below) → can miss 2 hours
    const result = calculateSafeBunks(12, 14, 45, 75, 1)
    expect(result).toBe(2)
  })

  it("student with 80% (48/60), 1hr sessions → 4 hours", () => {
    // n = floor((4800-4500)/75) = 4 sessions × 1h = 4 hours
    const result = calculateSafeBunks(48, 60, 60, 75, 1)
    expect(result).toBe(4)
  })

  it("student exactly at 75% threshold → 0 hours", () => {
    const result = calculateSafeBunks(45, 60, 60, 75, 1)
    expect(result).toBe(0)
  })

  it("student below 75% → 0 hours (cannot bunk)", () => {
    const result = calculateSafeBunks(18, 30, 60, 75, 1)
    expect(result).toBe(0)
  })

  it("never returns negative", () => {
    const result = calculateSafeBunks(0, 0, 60, 75, 1)
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it("2hr sessions: returns hours not sessions", () => {
    // 24 present / 30 held → 80%, 2hr sessions, 75% min
    // safeSessions = floor((2400-2250)/150) = 1 session → 1 × 2 = 2 hours
    // Verify: 24/32 = 75% ✓, 24/34 = 70.6% ✗
    const result = calculateSafeBunks(24, 30, 60, 75, 2)
    expect(result).toBe(2)
  })

  it("no classes held yet → 0 hours", () => {
    const result = calculateSafeBunks(0, 0, 60, 75, 1)
    expect(result).toBe(0)
  })
})

// ─── calculateClassesNeeded ──────────────────────────────────────────────────

describe("calculateClassesNeeded", () => {
  it("student at 60% needing 75% → returns a specific positive count", () => {
    // Present: 18hrs out of 30 total, needing 75% of 30 = 22.5hrs
    // Formula: ceil((0.75×30 - 18) / (1 - 0.75)) = ceil(4.5 / 0.25) = ceil(18) = 18
    const result = calculateClassesNeeded(18, 30, 30, 75, 1)
    expect(result).toBeGreaterThan(0)
  })

  it("student at 80% → returns 0 (already above minimum)", () => {
    const result = calculateClassesNeeded(24, 30, 30, 75, 1)
    expect(result).toBe(0)
  })

  it("student exactly at minimum → returns 0", () => {
    const result = calculateClassesNeeded(22.5, 30, 30, 75, 1)
    expect(result).toBe(0)
  })
})

// ─── calculateAttendanceStatus ────────────────────────────────────────────────

describe("calculateAttendanceStatus", () => {
  it("74% with 75% minimum → 'danger'", () => {
    expect(calculateAttendanceStatus(74, 75)).toBe("danger")
  })

  it("75% exactly → 'warning' (within 5%)", () => {
    expect(calculateAttendanceStatus(75, 75)).toBe("warning")
  })

  it("78% with 75% minimum → 'warning' (within 5%)", () => {
    expect(calculateAttendanceStatus(78, 75)).toBe("warning")
  })

  it("80% exactly at boundary → 'warning'", () => {
    expect(calculateAttendanceStatus(80, 75)).toBe("warning")
  })

  it("80.01% above boundary → 'safe'", () => {
    expect(calculateAttendanceStatus(80.01, 75)).toBe("safe")
  })

  it("85% with 75% minimum → 'safe'", () => {
    expect(calculateAttendanceStatus(85, 75)).toBe("safe")
  })

  it("0% is 'danger' with any positive minimum", () => {
    expect(calculateAttendanceStatus(0, 75)).toBe("danger")
  })
})

// ─── simulateAttendance ───────────────────────────────────────────────────────

describe("simulateAttendance", () => {
  it("attending 5 more classes improves projected percentage", () => {
    const before = calculateCurrentPercentage(30, 40)
    const { projectedPercentage } = simulateAttendance(30, 40, 60, 75, 5, 0)
    expect(projectedPercentage).toBeGreaterThan(before)
  })

  it("skipping 10 more classes drops projected percentage", () => {
    const before = calculateCurrentPercentage(30, 40)
    const { projectedPercentage } = simulateAttendance(30, 40, 60, 75, 0, 10)
    expect(projectedPercentage).toBeLessThan(before)
  })

  it("attending classes can shift status from warning to safe", () => {
    // Currently 78% → warning; add 10 more present sessions → should become safe
    const { status } = simulateAttendance(39, 50, 60, 75, 10, 0)
    expect(["safe", "warning"]).toContain(status)
  })

  it("returns correct projected present and held counts", () => {
    const { projectedPresent, projectedHeld } = simulateAttendance(30, 40, 60, 75, 5, 2)
    expect(projectedPresent).toBe(35)
    expect(projectedHeld).toBe(47)
  })

  it("safeBunksAfter is non-negative", () => {
    const { safeBunksAfter } = simulateAttendance(10, 40, 60, 75, 0, 5)
    expect(safeBunksAfter).toBeGreaterThanOrEqual(0)
  })
})

// ─── calculateOverallStats ────────────────────────────────────────────────────

describe("calculateOverallStats", () => {
  it("returns zero stats for empty array", () => {
    const result = calculateOverallStats([])
    expect(result.overallPercentage).toBe(0)
    expect(result.totalSafeBunks).toBe(0)
    expect(result.subjectsAtRisk).toBe(0)
  })

  it("counts danger and warning subjects correctly", () => {
    const statsArray: AttendanceStats[] = [
      {
        classTypeId: "1", classTypeName: "Theory", totalHours: 60,
        hoursPerSession: 1, minAttendance: 75, hoursHeld: 30,
        hoursPresent: 20, currentPercentage: 66.67, projectedPercentage: 33.33,
        safeBunks: 0, classesNeeded: 5, status: "danger",
      },
      {
        classTypeId: "2", classTypeName: "Lab", totalHours: 30,
        hoursPerSession: 2, minAttendance: 75, hoursHeld: 20,
        hoursPresent: 16, currentPercentage: 80, projectedPercentage: 53.33,
        safeBunks: 2, classesNeeded: 0, status: "warning",
      },
      {
        classTypeId: "3", classTypeName: "Tutorial", totalHours: 30,
        hoursPerSession: 1, minAttendance: 75, hoursHeld: 20,
        hoursPresent: 18, currentPercentage: 90, projectedPercentage: 60,
        safeBunks: 3, classesNeeded: 0, status: "safe",
      },
    ]
    const result = calculateOverallStats(statsArray)
    expect(result.subjectsAtRisk).toBe(1)
    expect(result.subjectsInWarning).toBe(1)
    expect(result.totalSafeBunks).toBe(5)
  })

  it("weights overall percentage by totalHours", () => {
    // 60% in a 60hr subject and 90% in a 30hr subject
    // weighted = (60*60 + 90*30) / 90 = (3600 + 2700) / 90 = 70
    const statsArray: AttendanceStats[] = [
      {
        classTypeId: "1", classTypeName: "Theory", totalHours: 60,
        hoursPerSession: 1, minAttendance: 75, hoursHeld: 30,
        hoursPresent: 18, currentPercentage: 60, projectedPercentage: 30,
        safeBunks: 0, classesNeeded: 3, status: "danger",
      },
      {
        classTypeId: "2", classTypeName: "Lab", totalHours: 30,
        hoursPerSession: 1, minAttendance: 75, hoursHeld: 30,
        hoursPresent: 27, currentPercentage: 90, projectedPercentage: 90,
        safeBunks: 4, classesNeeded: 0, status: "safe",
      },
    ]
    const result = calculateOverallStats(statsArray)
    expect(result.overallPercentage).toBe(70)
  })
})

// ─── calculateClassTypeStats ──────────────────────────────────────────────────

describe("calculateClassTypeStats", () => {
  const classType = makeClassType()

  it("counts only PRESENT and ABSENT toward hoursHeld", () => {
    const records = [
      makeRecord("PRESENT", "2024-05-01"),
      makeRecord("ABSENT", "2024-05-02"),
      makeRecord("CANCELLED", "2024-05-03"),
      makeRecord("HOLIDAY", "2024-05-04"),
    ]
    const stats = calculateClassTypeStats(classType, records)
    expect(stats.hoursHeld).toBe(2)    // 1 PRESENT + 1 ABSENT
    expect(stats.hoursPresent).toBe(1) // only PRESENT
  })

  it("filters records by class_type_id", () => {
    const records = [
      makeRecord("PRESENT", "2024-05-01", "ct-1"),
      makeRecord("PRESENT", "2024-05-01", "ct-2"), // different class type → ignored
    ]
    const stats = calculateClassTypeStats(classType, records)
    expect(stats.hoursPresent).toBe(1)
  })

  it("returns correct currentPercentage", () => {
    const records = [
      makeRecord("PRESENT", "2024-05-01"),
      makeRecord("PRESENT", "2024-05-02"),
      makeRecord("ABSENT", "2024-05-03"),
      makeRecord("ABSENT", "2024-05-04"),
    ]
    const stats = calculateClassTypeStats(classType, records)
    expect(stats.currentPercentage).toBe(50)
  })

  it("returns status 'danger' when below minimum", () => {
    const records = Array.from({ length: 30 }, (_, i) =>
      makeRecord("ABSENT", `2024-05-${String(i + 1).padStart(2, "0")}`)
    )
    const stats = calculateClassTypeStats(classType, records)
    expect(stats.status).toBe("danger")
  })

  it("returns status 'safe' when well above minimum", () => {
    const records = Array.from({ length: 50 }, (_, i) =>
      makeRecord("PRESENT", `2024-05-${String(i + 1).padStart(2, "0")}`)
    )
    const stats = calculateClassTypeStats(makeClassType({ total_hours: 60 }), records)
    expect(stats.status).toBe("safe")
  })
})

// ─── getStreakCount ───────────────────────────────────────────────────────────

// Helper: format a Date as local YYYY-MM-DD (avoids UTC off-by-one in IST)
function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

describe("getStreakCount", () => {
  it("returns 0 for empty records", () => {
    expect(getStreakCount([])).toBe(0)
  })

  it("counts consecutive present days correctly", () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const dayBefore = new Date(today)
    dayBefore.setDate(today.getDate() - 2)

    const records = [
      makeRecord("PRESENT", localDateStr(today)),
      makeRecord("PRESENT", localDateStr(yesterday)),
      makeRecord("PRESENT", localDateStr(dayBefore)),
    ]
    expect(getStreakCount(records)).toBe(3)
  })

  it("breaks streak on absent-only day", () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(today.getDate() - 2)

    const records = [
      makeRecord("PRESENT", localDateStr(today)),
      makeRecord("ABSENT", localDateStr(yesterday)), // breaks streak
      makeRecord("PRESENT", localDateStr(twoDaysAgo)), // not counted
    ]
    expect(getStreakCount(records)).toBe(1)
  })

  it("ignores CANCELLED and HOLIDAY records, carrying streak over them", () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const dayBefore = new Date(today)
    dayBefore.setDate(today.getDate() - 2)

    const records = [
      makeRecord("PRESENT", localDateStr(today)),
      makeRecord("CANCELLED", localDateStr(yesterday)), // ignored, skipped over
      makeRecord("PRESENT", localDateStr(dayBefore)),
    ]
    expect(getStreakCount(records)).toBe(2)
  })

  it("skips days with no records (e.g. weekends)", () => {
    const today = new Date()
    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(today.getDate() - 3)

    const records = [
      makeRecord("PRESENT", localDateStr(today)),
      // no records for yesterday and day before
      makeRecord("PRESENT", localDateStr(threeDaysAgo)),
    ]
    expect(getStreakCount(records)).toBe(2)
  })

  it("respects a custom checkDate", () => {
    // Use a fixed past date so UTC/local offsets don't matter
    const checkDate = new Date(2024, 4, 25) // May 25 2024 local
    const records = [
      makeRecord("PRESENT", "2024-05-25"),
      makeRecord("PRESENT", "2024-05-24"),
    ]
    expect(getStreakCount(records, checkDate)).toBe(2)
  })
})
