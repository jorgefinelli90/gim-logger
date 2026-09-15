'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Profile } from '@/types'
import { useStorageReady } from '@/hooks/useStorageReady'
import { useWeekOverview } from '@/hooks/useWeekOverview'
import { formatDayMonth, sessionTypeLabel, todayIso, weekdayShortLabel } from '@/lib/date/date-utils'

interface WeekCalendarProps {
  profile: Profile
  weekDates: string[]
  selectedDate: string
  onSelectDate: (date: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
}

const TYPE_COLOR: Record<string, string> = {
  calistenia: 'var(--lime)',
  'gimnasio-dia-1': 'var(--orange)',
  'gimnasio-dia-2': 'var(--orange)',
  'gimnasio-dia-3': 'var(--orange)',
  'gimnasio-dia-4': 'var(--orange)',
  descanso: 'var(--muted)',
}

export function WeekCalendar({ profile, weekDates, selectedDate, onSelectDate, onPrevWeek, onNextWeek }: WeekCalendarProps) {
  const { ready } = useStorageReady()
  const { overview, loading } = useWeekOverview(profile, weekDates, ready)
  const today = todayIso()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button className="icon-button" onClick={onPrevWeek} aria-label="Semana anterior">
          <ChevronLeft />
        </button>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {formatDayMonth(weekDates[0])} — {formatDayMonth(weekDates[6])}
        </span>
        <button className="icon-button" onClick={onNextWeek} aria-label="Semana siguiente">
          <ChevronRight />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 8 }}>
        {weekDates.map((date) => {
          const day = overview[date]
          const isToday = date === today
          const isSelected = date === selectedDate
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-pressed={isSelected}
              style={{
                display: 'grid',
                gap: 6,
                justifyItems: 'center',
                padding: '14px 6px',
                borderRadius: 12,
                border: isSelected ? '1px solid var(--lime)' : isToday ? '1px solid var(--orange)' : '1px solid var(--border)',
                background: isSelected ? 'var(--muted-surface, var(--line))' : 'var(--card)',
              }}
            >
              <span style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--muted)' }}>{weekdayShortLabel(date)}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>{Number(date.slice(8, 10))}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: day ? TYPE_COLOR[day.type] : 'var(--muted)' }} aria-hidden />
              <span style={{ fontSize: 9, color: 'var(--muted)', textAlign: 'center' }}>{day ? sessionTypeLabel(day.type) : ''}</span>
              {day && day.type !== 'descanso' && !loading && (
                <span style={{ fontSize: 10, fontWeight: 700, color: day.percent === 100 ? 'var(--lime)' : 'var(--muted)' }}>{day.totalSets > 0 ? `${day.percent}%` : '—'}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
