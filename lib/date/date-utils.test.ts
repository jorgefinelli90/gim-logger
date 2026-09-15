import { describe, expect, it } from 'vitest'
import { addDays, getWeekDates, sessionTypeForDate, toIsoDate, fromIsoDate } from './date-utils'

describe('sessionTypeForDate', () => {
  it("matches Jorge's fixed weekly schedule Mon-Sun", () => {
    // 2026-09-14 is a Monday.
    expect(sessionTypeForDate('jorge', '2026-09-14')).toBe('calistenia') // Mon
    expect(sessionTypeForDate('jorge', '2026-09-15')).toBe('gimnasio-dia-1') // Tue
    expect(sessionTypeForDate('jorge', '2026-09-16')).toBe('calistenia') // Wed
    expect(sessionTypeForDate('jorge', '2026-09-17')).toBe('gimnasio-dia-2') // Thu
    expect(sessionTypeForDate('jorge', '2026-09-18')).toBe('calistenia') // Fri
    expect(sessionTypeForDate('jorge', '2026-09-19')).toBe('gimnasio-dia-3') // Sat
    expect(sessionTypeForDate('jorge', '2026-09-20')).toBe('descanso') // Sun
  })

  it("matches Sebastián's fixed weekly schedule Mon-Sun", () => {
    expect(sessionTypeForDate('sebas', '2026-09-14')).toBe('descanso') // Mon
    expect(sessionTypeForDate('sebas', '2026-09-15')).toBe('gimnasio-dia-1') // Tue
    expect(sessionTypeForDate('sebas', '2026-09-16')).toBe('descanso') // Wed
    expect(sessionTypeForDate('sebas', '2026-09-17')).toBe('gimnasio-dia-2') // Thu
    expect(sessionTypeForDate('sebas', '2026-09-18')).toBe('gimnasio-dia-3') // Fri
    expect(sessionTypeForDate('sebas', '2026-09-19')).toBe('gimnasio-dia-4') // Sat
    expect(sessionTypeForDate('sebas', '2026-09-20')).toBe('descanso') // Sun
  })
})

describe('toIsoDate / fromIsoDate', () => {
  it('round-trips without timezone drift', () => {
    const date = fromIsoDate('2026-01-31')
    expect(toIsoDate(date)).toBe('2026-01-31')
  })
})

describe('addDays', () => {
  it('rolls over month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('getWeekDates', () => {
  it('returns Monday-Sunday when firstDayOfWeek is monday', () => {
    const week = getWeekDates('2026-09-17', 'monday') // a Thursday
    expect(week).toEqual(['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'])
  })

  it('returns Sunday-Saturday when firstDayOfWeek is sunday', () => {
    const week = getWeekDates('2026-09-17', 'sunday')
    expect(week[0]).toBe('2026-09-13')
    expect(week[6]).toBe('2026-09-19')
  })
})
