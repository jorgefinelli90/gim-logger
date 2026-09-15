'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { DateNavigator } from '@/components/dashboard/DateNavigator'
import { ReminderBanner } from '@/components/dashboard/ReminderBanner'
import { WorkoutSessionView } from '@/components/workout/WorkoutSessionView'
import { RoutineSwapControl } from '@/components/workout/RoutineSwapControl'
import { todayIso, weekdayLabel } from '@/lib/date/date-utils'
import { PLAN_META, DEFAULT_PLAN_META } from '@/components/workout/plan-meta'
import { useActiveProfile } from '@/lib/profile/ProfileContext'
import { useStorageReady } from '@/hooks/useStorageReady'
import { useEffectiveSessionType } from '@/hooks/useEffectiveSessionType'
import { PROFILE_LABELS } from '@/types'

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
  const { profile } = useActiveProfile()
  const { ready } = useStorageReady()
  const { type, isDefault, changeType } = useEffectiveSessionType(profile, date, ready)
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
          <RoutineSwapControl profile={profile} type={type} isDefault={isDefault} onChange={changeType} />
        </div>
        <div className="header-actions">
          <button className="icon-button" aria-label="Buscar ejercicio">
            <Search />
          </button>
          <div className="avatar" aria-hidden>
            {PROFILE_LABELS[profile][0]}
          </div>
        </div>
      </header>

      <ReminderBanner date={date} type={type} />

      <div style={{ marginTop: 32 }}>
        <WorkoutSessionView profile={profile} date={date} type={type} title={meta.title} subtitle={meta.subtitle} typeBadge={meta.badge} />
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
