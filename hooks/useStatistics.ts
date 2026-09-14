'use client'

import { useEffect, useState } from 'react'
import type { Exercise, ExerciseSet, PersonalRecord, WorkoutSession } from '@/types'
import { listSessions } from '@/lib/storage/repositories/session-repo'
import { listAllSets } from '@/lib/storage/repositories/set-repo'
import { listExercises } from '@/lib/storage/repositories/exercise-repo'
import { listRecords } from '@/lib/storage/repositories/record-repo'
import {
  computeMuscleDistribution,
  computeStreaks,
  computeTotals,
  computeTotalTrainingMinutes,
  computeWeightProgression,
  countSessionsInRange,
} from '@/lib/statistics/aggregate'
import { addDays, todayIso } from '@/lib/date/date-utils'

export function useStatistics(storageReady: boolean) {
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [sets, setSets] = useState<ExerciseSet[]>([])
  const [exercises, setExercises] = useState<Record<string, Exercise>>({})
  const [records, setRecords] = useState<PersonalRecord[]>([])

  useEffect(() => {
    if (!storageReady) return
    let cancelled = false
    Promise.all([listSessions(), listAllSets(), listExercises(), listRecords()]).then(([s, st, ex, rec]) => {
      if (cancelled) return
      setSessions(s)
      setSets(st)
      setExercises(Object.fromEntries(ex.map((e) => [e.id, e])))
      setRecords(rec)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [storageReady])

  const sessionDateById = Object.fromEntries(sessions.map((s) => [s.id, s.date]))
  const today = todayIso()

  return {
    loading,
    streaks: computeStreaks(sessions, sets, today),
    totals: computeTotals(sessions, sets),
    totalTrainingMinutes: computeTotalTrainingMinutes(sessions),
    muscleDistribution: computeMuscleDistribution(sets, exercises),
    weightProgressionByExercise: (exerciseId: string) =>
      computeWeightProgression(
        sets.filter((s) => s.exerciseId === exerciseId),
        sessionDateById,
      ),
    weeklyCount: countSessionsInRange(sessions, sets, addDays(today, -6), today),
    monthlyCount: countSessionsInRange(sessions, sets, addDays(today, -29), today),
    records,
    exercises,
    sessions,
    sets,
  }
}
