'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { DateNavigator } from '@/components/dashboard/DateNavigator'
import { ReminderBanner } from '@/components/dashboard/ReminderBanner'
import { WorkoutSessionView } from '@/components/workout/WorkoutSessionView'
import { todayIso, sessionTypeForDate, weekdayLabel } from '@/lib/date/date-utils'
import { PLAN_META, DEFAULT_PLAN_META } from '@/components/workout/plan-meta'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const [date, setDate] = useState(dateParam && ISO_DATE_RE.test(dateParam) ? dateParam : todayIso())
  const type = sessionTypeForDate(date)
  const meta = PLAN_META[type] ?? DEFAULT_PLAN_META

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">
            {weekdayLabel(date).toUpperCase()} <span>•</span> IRON LOG
          </p>
          <h1>
            Tu semana, <em>en movimiento.</em>
          </h1>
          <DateNavigator date={date} onChange={setDate} />
        </div>
        <div className="header-actions">
          <button className="icon-button" aria-label="Buscar ejercicio">
            <Search />
          </button>
          <div className="avatar" aria-hidden>
            J
          </div>
        </div>
      </header>

      <ReminderBanner date={date} type={type} />

      <div style={{ marginTop: 32 }}>
        <WorkoutSessionView date={date} type={type} title={meta.title} subtitle={meta.subtitle} typeBadge={meta.badge} />
      </div>

      <footer className="footer">
        <span>
          <span className="status-dot" /> PROGRESO GUARDADO EN ESTE DISPOSITIVO
        </span>
        <span>
          IRON LOG <b>•</b> TU RUTINA, TU RITMO.
        </span>
      </footer>
    </>
  )
}
