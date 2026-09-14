'use client'

import { useEffect, useState } from 'react'
import type { Exercise, ExerciseSet, WorkoutSession } from '@/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ExerciseImage } from '@/components/exercises/ExerciseImage'
import { getSetsByExercise } from '@/lib/storage/repositories/set-repo'
import { listSessions } from '@/lib/storage/repositories/session-repo'
import { formatDayMonth } from '@/lib/date/date-utils'
import { updateExercise } from '@/lib/storage/repositories/exercise-repo'

interface ExerciseDetailSheetProps {
  exercise: Exercise | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onExerciseUpdated?: (exercise: Exercise) => void
}

export function ExerciseDetailSheet({ exercise, open, onOpenChange, onExerciseUpdated }: ExerciseDetailSheetProps) {
  const [history, setHistory] = useState<{ date: string; sets: ExerciseSet[] }[]>([])

  useEffect(() => {
    if (!open || !exercise) return
    let cancelled = false
    Promise.all([getSetsByExercise(exercise.id), listSessions()]).then(([sets, sessions]) => {
      if (cancelled) return
      const sessionDateById = Object.fromEntries(sessions.map((s: WorkoutSession) => [s.id, s.date]))
      const byDate = new Map<string, ExerciseSet[]>()
      for (const set of sets) {
        if (!set.completed) continue
        const date = sessionDateById[set.sessionId]
        if (!date) continue
        const list = byDate.get(date) ?? []
        list.push(set)
        byDate.set(date, list)
      }
      const rows = [...byDate.entries()].map(([date, sets]) => ({ date, sets })).sort((a, b) => b.date.localeCompare(a.date))
      setHistory(rows.slice(0, 5))
    })
    return () => {
      cancelled = true
    }
  }, [open, exercise])

  if (!exercise) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <ExerciseImage
              exercise={exercise}
              size={84}
              onSetCustomUrl={async (url) => {
                const updated = await updateExercise(exercise.id, { image: { ...exercise.image, customUrl: url } })
                onExerciseUpdated?.(updated)
              }}
            />
            <div>
              <SheetTitle>{exercise.name}</SheetTitle>
              <SheetDescription className="capitalize">{exercise.muscleGroup.replace('-', ' ')}</SheetDescription>
              {exercise.equipment.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Equipo: {exercise.equipment.join(', ')}</p>}
            </div>
          </div>
        </SheetHeader>

        {exercise.instructions.length > 0 && (
          <section className="mb-5">
            <h3 className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">Ejecución</h3>
            <ol className="grid gap-1.5 pl-4 text-sm text-foreground">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="list-decimal">
                  {step}
                </li>
              ))}
            </ol>
          </section>
        )}

        {exercise.commonMistakes.length > 0 && (
          <section className="mb-5">
            <h3 className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">Errores comunes / consejo</h3>
            <ul className="grid gap-1.5 pl-4 text-sm text-foreground">
              {exercise.commonMistakes.map((tip, i) => (
                <li key={i} className="list-disc">
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        )}

        {exercise.alternatives.length > 0 && (
          <section className="mb-5">
            <h3 className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">Alternativa equivalente</h3>
            <p className="text-sm text-foreground">{exercise.alternatives.join(', ')}</p>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">Historial reciente</h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay series completadas de este ejercicio.</p>
          ) : (
            <ul className="grid gap-2">
              {history.map(({ date, sets }) => (
                <li key={date} className="rounded-md border border-border bg-background p-2 text-sm">
                  <span className="font-medium text-foreground">{formatDayMonth(date)}</span>{' '}
                  <span className="text-muted-foreground">
                    {sets.map((s) => (s.weight != null ? `${s.weight}${s.unit}×${s.actualReps ?? '?'}` : s.durationSeconds != null ? `${s.durationSeconds}s` : `${s.actualReps ?? '?'} reps`)).join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </SheetContent>
    </Sheet>
  )
}
