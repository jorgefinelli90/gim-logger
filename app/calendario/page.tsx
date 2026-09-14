'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { WeekCalendar } from '@/components/calendar/WeekCalendar'
import { usePreferences } from '@/hooks/usePreferences'
import { addDays, formatLongDate, getWeekDates, sessionTypeForDate, todayIso } from '@/lib/date/date-utils'
import { PLAN_META, DEFAULT_PLAN_META } from '@/components/workout/plan-meta'

export default function CalendarioPage() {
  const { preferences } = usePreferences()
  const [selectedDate, setSelectedDate] = useState(todayIso())
  const weekDates = getWeekDates(selectedDate, preferences.firstDayOfWeek)
  const type = sessionTypeForDate(selectedDate)
  const meta = PLAN_META[type] ?? DEFAULT_PLAN_META

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">TU SEMANA</p>
          <h1>
            <em>Calendario.</em>
          </h1>
        </div>
      </header>

      <div style={{ marginTop: 28, maxWidth: 720 }}>
        <WeekCalendar
          weekDates={weekDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevWeek={() => setSelectedDate(addDays(selectedDate, -7))}
          onNextWeek={() => setSelectedDate(addDays(selectedDate, 7))}
        />

        <section className="exercise-card" style={{ flexDirection: 'column', alignItems: 'stretch', height: 'auto', marginTop: 24, padding: 20 }}>
          <span className={`type-badge ${meta.badge.tone}`} style={{ justifySelf: 'start', width: 'fit-content' }}>
            {meta.badge.label}
          </span>
          <h2 style={{ margin: '10px 0 2px' }}>{meta.title}</h2>
          <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'capitalize' }}>{formatLongDate(selectedDate)}</p>
          {meta.subtitle && <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{meta.subtitle}</p>}

          {type !== 'descanso' && (
            <Link
              href={`/?date=${selectedDate}`}
              style={{ marginTop: 16, display: 'inline-flex', gap: 8, alignItems: 'center', color: 'var(--foreground)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
            >
              Ver rutina completa <ArrowRight size={15} />
            </Link>
          )}
        </section>
      </div>
    </>
  )
}
