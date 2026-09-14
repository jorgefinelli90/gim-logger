import type { Exercise, ExerciseSet, MuscleGroup, WorkoutSession } from '@/types'
import { addDays, sessionTypeForDate, todayIso } from '@/lib/date/date-utils'

export interface StreakResult {
  current: number
  max: number
}

function isSessionCompleted(session: WorkoutSession, sets: ExerciseSet[]): boolean {
  const sessionSets = sets.filter((s) => s.sessionId === session.id)
  if (sessionSets.length === 0) return false
  return sessionSets.some((s) => s.completed)
}

/** A date "counts" toward a streak if it was a training day (not rest) and it has a completed session. */
export function computeStreaks(sessions: WorkoutSession[], sets: ExerciseSet[], today: string = todayIso()): StreakResult {
  const completedDates = new Set(
    sessions.filter((s) => s.type !== 'descanso' && isSessionCompleted(s, sets)).map((s) => s.date),
  )

  let current = 0
  let cursor = today
  // Walk backward from today; rest days don't break the streak, missed training days do.
  while (true) {
    const type = sessionTypeForDate(cursor)
    if (type === 'descanso') {
      cursor = addDays(cursor, -1)
      continue
    }
    if (completedDates.has(cursor)) {
      current += 1
      cursor = addDays(cursor, -1)
    } else {
      break
    }
  }

  if (completedDates.size === 0) return { current: 0, max: 0 }

  const sortedDates = [...completedDates].sort()
  let max = 0
  let running = 0
  const earliest = sortedDates[0]
  const latest = sortedDates[sortedDates.length - 1]
  let d = earliest
  while (d <= latest) {
    const type = sessionTypeForDate(d)
    if (type !== 'descanso') {
      if (completedDates.has(d)) {
        running += 1
        max = Math.max(max, running)
      } else {
        running = 0
      }
    }
    d = addDays(d, 1)
  }

  return { current, max }
}

export interface TotalsResult {
  totalVolume: number
  totalSets: number
  totalReps: number
  workoutsCompleted: number
}

export function computeTotals(sessions: WorkoutSession[], sets: ExerciseSet[]): TotalsResult {
  const completedSets = sets.filter((s) => s.completed)
  const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.actualReps ?? 0), 0)
  const totalReps = completedSets.reduce((sum, s) => sum + (s.actualReps ?? 0), 0)
  const workoutsCompleted = sessions.filter((s) => s.type !== 'descanso' && isSessionCompleted(s, sets)).length
  return { totalVolume, totalSets: completedSets.length, totalReps, workoutsCompleted }
}

export function computeTotalTrainingMinutes(sessions: WorkoutSession[]): number {
  let totalMs = 0
  for (const session of sessions) {
    if (session.startedAt && session.completedAt) {
      totalMs += new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()
    }
  }
  return Math.round(totalMs / 60000)
}

export interface MuscleDistributionEntry {
  muscleGroup: MuscleGroup
  sets: number
}

export function computeMuscleDistribution(sets: ExerciseSet[], exercises: Record<string, Exercise>): MuscleDistributionEntry[] {
  const counts = new Map<MuscleGroup, number>()
  for (const set of sets) {
    if (!set.completed) continue
    const exercise = exercises[set.exerciseId]
    if (!exercise) continue
    counts.set(exercise.muscleGroup, (counts.get(exercise.muscleGroup) ?? 0) + 1)
  }
  return [...counts.entries()].map(([muscleGroup, count]) => ({ muscleGroup, sets: count })).sort((a, b) => b.sets - a.sets)
}

export interface WeightPoint {
  date: string
  maxWeight: number
}

export function computeWeightProgression(sets: ExerciseSet[], sessionDateById: Record<string, string>): WeightPoint[] {
  const byDate = new Map<string, number>()
  for (const set of sets) {
    if (!set.completed || set.weight == null) continue
    const date = sessionDateById[set.sessionId]
    if (!date) continue
    byDate.set(date, Math.max(byDate.get(date) ?? 0, set.weight))
  }
  return [...byDate.entries()].map(([date, maxWeight]) => ({ date, maxWeight })).sort((a, b) => a.date.localeCompare(b.date))
}

export function countSessionsInRange(sessions: WorkoutSession[], sets: ExerciseSet[], startIso: string, endIso: string): number {
  return sessions.filter((s) => s.type !== 'descanso' && s.date >= startIso && s.date <= endIso && isSessionCompleted(s, sets)).length
}
