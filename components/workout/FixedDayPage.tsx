'use client'

import type { PlanDayId } from '@/types'
import { WorkoutSessionView } from './WorkoutSessionView'
import { PLAN_META, DEFAULT_PLAN_META } from './plan-meta'
import { todayIso } from '@/lib/date/date-utils'
import { useActiveProfile } from '@/lib/profile/ProfileContext'

/** Lets the user jump straight into a specific routine day regardless of today's schedule (e.g. to make up a missed session). Always logs against today's date. */
export function FixedDayPage({ planId }: { planId: PlanDayId }) {
  const { profile } = useActiveProfile()
  const meta = PLAN_META[planId] ?? DEFAULT_PLAN_META
  const date = todayIso()

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">GIMNASIO</p>
          <h1>{meta.title}</h1>
        </div>
      </header>
      <div style={{ marginTop: 32 }}>
        <WorkoutSessionView profile={profile} date={date} type={planId} title={meta.title} subtitle={meta.subtitle} typeBadge={meta.badge} />
      </div>
    </>
  )
}
