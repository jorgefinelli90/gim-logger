'use client'

import { useMemo } from 'react'
import type { Profile, SessionType } from '@/types'
import { useStorageReady } from '@/hooks/useStorageReady'
import { usePreferences } from '@/hooks/usePreferences'
import { useWorkoutSession } from '@/hooks/useWorkoutSession'
import { useExercises } from '@/hooks/useExercises'
import { useDailyNote } from '@/hooks/useDailyNote'
import { ExerciseSessionCard } from './ExerciseSessionCard'
import { AddExerciseDialog } from './AddExerciseDialog'
import { RestTimerCard } from '@/components/timer/RestTimerCard'
import { DailyNoteEditor } from '@/components/notes/DailyNoteEditor'
import { EmptyState } from '@/components/common/EmptyState'
import { sessionTypeLabel } from '@/lib/date/date-utils'
import { Dumbbell } from 'lucide-react'

interface WorkoutSessionViewProps {
  profile: Profile
  date: string
  type: SessionType
  title: string
  subtitle: string
  typeBadge: { label: string; tone: 'lime' | 'orange' }
}

export function WorkoutSessionView({ profile, date, type, title, subtitle, typeBadge }: WorkoutSessionViewProps) {
  const { ready } = useStorageReady()
  const { preferences } = usePreferences()
  const session = useWorkoutSession(profile, date, type, ready, preferences.units)
  const { exercises: allExercises, edit: editExercise } = useExercises(profile, ready)
  const note = useDailyNote(profile, date, ready)

  const orderedExerciseIds = useMemo(() => session.plan?.exercises.slice().sort((a, b) => a.order - b.order).map((pe) => pe.exerciseId) ?? [], [session.plan])

  if (type === 'descanso') {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Día de descanso"
        description="Hoy toca recuperar. Aprovechá para estirar, dormir bien y volver con todo mañana."
      />
    )
  }

  if (session.loading) {
    return <p style={{ color: 'var(--muted)', padding: '40px 0', textAlign: 'center' }}>Cargando rutina…</p>
  }

  if (session.error) {
    return <p role="alert" style={{ color: 'var(--danger)', padding: '40px 0', textAlign: 'center' }}>{session.error}</p>
  }

  if (!session.plan || session.plan.exercises.length === 0) {
    return <EmptyState icon={Dumbbell} title="Sin ejercicios configurados" description="Agregá ejercicios a esta rutina desde Configuración." />
  }

  return (
    <div className="dashboard-grid">
      <div className="main-column">
        <section className="session-heading">
          <div>
            <span className={`type-badge ${typeBadge.tone}`}>{typeBadge.label}</span>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <div className="completion">
            <strong>
              {session.progress.completed}
              <small>/{session.progress.total}</small>
            </strong>
            <span>
              SERIES
              <br />
              LISTAS
            </span>
          </div>
        </section>
        <div className="session-progress">
          <span style={{ width: `${session.progress.percent}%` }} />
        </div>

        <div className="exercise-list" style={{ marginTop: 20 }}>
          {orderedExerciseIds.map((exerciseId, index) => {
            const exercise = session.exercises[exerciseId] ?? allExercises.find((e) => e.id === exerciseId)
            if (!exercise) return null
            const planExercise = session.plan?.exercises.find((pe) => pe.exerciseId === exerciseId)
            const setsForExercise = session.setsByExercise[exerciseId] ?? []
            return (
              <ExerciseSessionCard
                key={exerciseId}
                exercise={exercise}
                planExercise={planExercise}
                sets={setsForExercise}
                index={index}
                onToggleSet={session.toggleSet}
                onUpdateSet={session.updateSetFields}
                onResetSet={session.resetSet}
                onAddSet={() => session.addExtraSet(exerciseId)}
                onDuplicateLastWeight={() => session.duplicateLastWeight(exerciseId)}
                onExerciseUpdated={(updated) => editExercise(updated.id, updated)}
              />
            )
          })}
        </div>

        {/* Calisthenics is the freely editable routine — the gym days come
            from the spreadsheet and are edited there. */}
        {session.plan.type === 'calistenia' && (
          <div style={{ marginTop: 14 }}>
            <AddExerciseDialog profile={profile} planId={session.plan.dayId} category="calistenia" storageReady={ready} onAdded={session.refresh} />
          </div>
        )}
      </div>
      <aside className="right-column">
        <RestTimerCard />
        <DailyNoteEditor note={note.note} onChange={note.save} />
      </aside>
    </div>
  )
}

export { sessionTypeLabel }
