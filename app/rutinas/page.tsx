'use client'

import Link from 'next/link'
import { ChevronRight, Dumbbell } from 'lucide-react'

const DAYS = [
  { href: '/rutinas/dia-1', title: 'Día 1', subtitle: 'Pecho, tríceps y antebrazo' },
  { href: '/rutinas/dia-2', title: 'Día 2', subtitle: 'Espalda, bíceps y hombros' },
  { href: '/rutinas/dia-3', title: 'Día 3', subtitle: 'Piernas y abdomen' },
]

export default function RutinasPage() {
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
        {DAYS.map((day) => (
          <Link key={day.href} href={day.href} className="exercise-card" style={{ textDecoration: 'none' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--ink)', color: 'var(--lime)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Dumbbell size={20} aria-hidden />
            </div>
            <div className="exercise-copy">
              <h3>{day.title}</h3>
              <p>{day.subtitle}</p>
            </div>
            <ChevronRight className="arrow" aria-hidden />
          </Link>
        ))}
      </div>
    </>
  )
}
