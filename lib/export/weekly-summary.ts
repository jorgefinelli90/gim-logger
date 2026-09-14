import type { Exercise, ExerciseSet, WorkoutSession } from '@/types'
import { addDays, formatLongDate, sessionTypeLabel, todayIso } from '@/lib/date/date-utils'
import { computeTotals } from '@/lib/statistics/aggregate'

export function buildWeeklySummary(sessions: WorkoutSession[], sets: ExerciseSet[], exercises: Record<string, Exercise>): string {
  const today = todayIso()
  const start = addDays(today, -6)
  const weekSessions = sessions.filter((s) => s.date >= start && s.date <= today)
  const weekSets = sets.filter((s) => weekSessions.some((ws) => ws.id === s.sessionId))
  const totals = computeTotals(weekSessions, weekSets)

  const lines: string[] = []
  lines.push(`RESUMEN SEMANAL — IRON LOG`)
  lines.push(`${formatLongDate(start)} a ${formatLongDate(today)}`)
  lines.push('')
  lines.push(`Entrenamientos completados: ${totals.workoutsCompleted}`)
  lines.push(`Series totales: ${totals.totalSets}`)
  lines.push(`Repeticiones totales: ${totals.totalReps}`)
  lines.push(`Volumen total: ${Math.round(totals.totalVolume)} kg`)
  lines.push('')
  lines.push('Detalle por día:')

  let cursor = start
  while (cursor <= today) {
    const daySessions = weekSessions.filter((s) => s.date === cursor)
    if (daySessions.length === 0) {
      lines.push(`  ${cursor}: sin sesión registrada`)
    } else {
      for (const session of daySessions) {
        const daySets = weekSets.filter((s) => s.sessionId === session.id && s.completed)
        const exerciseNames = [...new Set(daySets.map((s) => exercises[s.exerciseId]?.name).filter(Boolean))]
        const detail = exerciseNames.length > 0 ? ` (${exerciseNames.join(', ')})` : ''
        lines.push(`  ${cursor} — ${sessionTypeLabel(session.type)}: ${daySets.length} series completadas${detail}`)
      }
    }
    cursor = addDays(cursor, 1)
  }

  return lines.join('\n')
}
