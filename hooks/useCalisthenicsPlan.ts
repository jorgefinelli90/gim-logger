'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PlanExercise, WorkoutPlan } from '@/types'
import { getPlan, savePlan } from '@/lib/storage/repositories/plan-repo'
import { createId, nowIso } from '@/lib/storage/ids'

export function useCalisthenicsPlan(storageReady: boolean) {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!storageReady) return
    const result = await getPlan('calistenia')
    setPlan(result ?? null)
    setLoading(false)
  }, [storageReady])

  useEffect(() => {
    load()
  }, [load])

  const persist = useCallback(async (next: WorkoutPlan) => {
    await savePlan(next)
    setPlan(next)
  }, [])

  const addExercise = useCallback(
    async (exerciseId: string, targetSets = 3, targetReps: string | null = null, restSeconds = 60) => {
      if (!plan) return
      const entry: PlanExercise = {
        id: createId('pe'),
        exerciseId,
        order: plan.exercises.length,
        targetSets,
        targetReps,
        targetWeightByWeek: [null, null, null, null],
        restSeconds,
        notes: null,
      }
      await persist({ ...plan, exercises: [...plan.exercises, entry], updatedAt: nowIso() })
    },
    [plan, persist],
  )

  const updateExercise = useCallback(
    async (planExerciseId: string, patch: Partial<PlanExercise>) => {
      if (!plan) return
      const exercises = plan.exercises.map((pe) => (pe.id === planExerciseId ? { ...pe, ...patch } : pe))
      await persist({ ...plan, exercises, updatedAt: nowIso() })
    },
    [plan, persist],
  )

  const removeExercise = useCallback(
    async (planExerciseId: string) => {
      if (!plan) return
      const exercises = plan.exercises.filter((pe) => pe.id !== planExerciseId).map((pe, i) => ({ ...pe, order: i }))
      await persist({ ...plan, exercises, updatedAt: nowIso() })
    },
    [plan, persist],
  )

  const moveExercise = useCallback(
    async (planExerciseId: string, direction: -1 | 1) => {
      if (!plan) return
      const sorted = [...plan.exercises].sort((a, b) => a.order - b.order)
      const index = sorted.findIndex((pe) => pe.id === planExerciseId)
      const targetIndex = index + direction
      if (index === -1 || targetIndex < 0 || targetIndex >= sorted.length) return
      ;[sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]]
      const exercises = sorted.map((pe, i) => ({ ...pe, order: i }))
      await persist({ ...plan, exercises, updatedAt: nowIso() })
    },
    [plan, persist],
  )

  return { plan, loading, addExercise, updateExercise, removeExercise, moveExercise, refresh: load }
}
