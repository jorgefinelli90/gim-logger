'use client'

import { useEffect, useState } from 'react'
import type { Exercise, ExerciseSet, PersonalRecord, Profile, WorkoutSession } from '@/types'
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
import { useSyncVersion } from '@/lib/sync/notify'

export function useStatistics(profile: Profile, storageReady: boolean) {
  const syncVersion = useSyncVersion()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [sets, setSets] = useState<ExerciseSet[]>([])
  const [exercises, setExercises] = useState<Record<string, Exercise>>({})
  const [records, setRecords] = useState<PersonalRecord[]>([])

  useEffect(() => {
    if (!storageReady) return
    let cancelled = false
    Promise.all([listSessions(), listAllSets(), listExercises(profile), listRecords()]).then(([s, st, ex, rec]) => {
      if (cancelled) return
      setSessions(s.filter((x) => x.profile === profile))
      setSets(st.filter((x) => x.profile === profile))
      setExercises(Object.fromEntries(ex.map((e) => [e.id, e])))
      setRecords(rec.filter((x) => x.profile === profile))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [profile, storageReady, syncVersion])

  const sessionDateById = Object.fromEntries(sessions.map((s) => [s.id, s.date]))
  const today = todayIso()

  return {
    loading,
    streaks: computeStreaks(profile, sessions, sets, today),
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
