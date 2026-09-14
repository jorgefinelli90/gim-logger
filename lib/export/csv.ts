import type { Exercise, ExerciseSet, WorkoutSession } from '@/types'

function csvEscape(value: string | number | null): string {
  if (value === null) return ''
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const HEADERS = ['fecha', 'tipo_sesion', 'ejercicio', 'grupo_muscular', 'serie', 'reps_objetivo', 'reps_reales', 'peso', 'unidad', 'rpe', 'duracion_segundos', 'nota']

export function buildHistoryCsv(sets: ExerciseSet[], sessions: WorkoutSession[], exercises: Record<string, Exercise>): string {
  const sessionById = Object.fromEntries(sessions.map((s) => [s.id, s]))
  const rows = sets
    .filter((s) => s.completed)
    .sort((a, b) => (sessionById[a.sessionId]?.date ?? '').localeCompare(sessionById[b.sessionId]?.date ?? ''))
    .map((set) => {
      const session = sessionById[set.sessionId]
      const exercise = exercises[set.exerciseId]
      return [
        session?.date ?? '',
        session?.type ?? '',
        exercise?.name ?? set.exerciseId,
        exercise?.muscleGroup ?? '',
        set.setIndex + 1,
        set.targetReps ?? '',
        set.actualReps ?? '',
        set.weight ?? '',
        set.unit,
        set.rpe ?? '',
        set.durationSeconds ?? '',
        set.note ?? '',
      ]
        .map(csvEscape)
        .join(',')
    })
  return [HEADERS.join(','), ...rows].join('\n')
}
