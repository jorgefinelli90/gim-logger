import type { SessionType, WeekStartDay } from '@/types'

/** Fixed weekly schedule: Mon/Wed/Fri calistenia, Tue/Thu/Sat gym Día 1/2/3, Sun rest. */
const WEEKDAY_SCHEDULE: Record<number, SessionType> = {
  0: 'descanso',
  1: 'calistenia',
  2: 'gimnasio-dia-1',
  3: 'calistenia',
  4: 'gimnasio-dia-2',
  5: 'calistenia',
  6: 'gimnasio-dia-3',
}

const WEEKDAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const WEEKDAY_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

export function sessionTypeForDate(iso: string): SessionType {
  const date = fromIsoDate(iso)
  return WEEKDAY_SCHEDULE[date.getDay()]
}

export function weekdayLabel(iso: string): string {
  return WEEKDAY_LABELS[fromIsoDate(iso).getDay()]
}

export function weekdayShortLabel(iso: string): string {
  return WEEKDAY_SHORT[fromIsoDate(iso).getDay()]
}

export function addDays(iso: string, amount: number): string {
  const date = fromIsoDate(iso)
  date.setDate(date.getDate() + amount)
  return toIsoDate(date)
}

export function isSameDate(a: string, b: string): boolean {
  return a === b
}

/** Returns the 7 ISO dates of the week containing `iso`, respecting the configured first day of week. */
export function getWeekDates(iso: string, firstDayOfWeek: WeekStartDay): string[] {
  const date = fromIsoDate(iso)
  const jsDay = date.getDay() // 0 = Sunday
  const offsetFromStart = firstDayOfWeek === 'monday' ? (jsDay === 0 ? 6 : jsDay - 1) : jsDay
  const start = addDays(iso, -offsetFromStart)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function formatDayMonth(iso: string): string {
  const date = fromIsoDate(iso)
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export function formatLongDate(iso: string): string {
  const date = fromIsoDate(iso)
  return date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function sessionTypeLabel(type: SessionType): string {
  switch (type) {
    case 'descanso':
      return 'Descanso'
    case 'calistenia':
      return 'Calistenia'
    case 'gimnasio-dia-1':
      return 'Gimnasio · Día 1'
    case 'gimnasio-dia-2':
      return 'Gimnasio · Día 2'
    case 'gimnasio-dia-3':
      return 'Gimnasio · Día 3'
  }
}
