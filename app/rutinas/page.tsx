'use client'

import Link from 'next/link'
import { ChevronRight, Dumbbell } from 'lucide-react'
import { useActiveProfile } from '@/lib/profile/ProfileContext'
import { PLAN_META, DEFAULT_PLAN_META } from '@/components/workout/plan-meta'
import { planDaysForProfile } from '@/lib/date/profile-schedule'
import type { PlanDayId } from '@/types'

const DAY_HREF: Record<PlanDayId, string> = {
  'gimnasio-dia-1': '/rutinas/dia-1',
  'gimnasio-dia-2': '/rutinas/dia-2',
  'gimnasio-dia-3': '/rutinas/dia-3',
  'gimnasio-dia-4': '/rutinas/dia-4',
  calistenia: '/calistenia',
}

export default function RutinasPage() {
  const { profile } = useActiveProfile()
  // Calistenia se edita desde su propia pantalla, no acá — esta lista es solo
  // de los días de gimnasio del perfil activo.
  const days = planDaysForProfile(profile).filter((d) => d !== 'calistenia') as Exclude<PlanDayId, 'calistenia'>[]

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">GIMNASIO</p>
          <h1>
            Tus <em>rutinas.</em>
          </h1>
        </div>
      </header>

      <div className="exercise-list" style={{ marginTop: 32, maxWidth: 640 }}>
        {days.map((day) => {
          const meta = PLAN_META[day] ?? DEFAULT_PLAN_META
          return (
            <Link key={day} href={DAY_HREF[day]} className="exercise-card" style={{ textDecoration: 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--ink)', color: 'var(--lime)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Dumbbell size={20} aria-hidden />
              </div>
              <div className="exercise-copy">
                <h3>{meta.title.replace('Gimnasio · ', '')}</h3>
                <p>{meta.subtitle}</p>
              </div>
              <ChevronRight className="arrow" aria-hidden />
            </Link>
          )
        })}
      </div>
    </>
  )
}
