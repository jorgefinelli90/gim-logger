'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Exercise, ExerciseSet, PlanDayId, SessionType, WeightUnit, WorkoutPlan, WorkoutSession } from '@/types'
import { getOrCreateSessionForDate, updateSession } from '@/lib/storage/repositories/session-repo'
import { getSetsBySession, createSet, updateSet as updateSetRepo, getSetsByExercise, seedSetsForSession } from '@/lib/storage/repositories/set-repo'
import { getPlan } from '@/lib/storage/repositories/plan-repo'
import { listExercises } from '@/lib/storage/repositories/exercise-repo'
import { maybeUpdateRecord } from '@/lib/storage/repositories/record-repo'
import { nowIso } from '@/lib/storage/ids'

function planIdFromType(type: SessionType): PlanDayId | null {
  return type === 'descanso' ? null : (type as PlanDayId)
}

export interface WorkoutSessionState {
  loading: boolean
  error: string | null
  session: WorkoutSession | null
  plan: WorkoutPlan | null
  exercises: Record<string, Exercise>
  sets: ExerciseSet[]
  setsByExercise: Record<string, ExerciseSet[]>
  progress: { completed: number; total: number; percent: number }
}

interface Actions {
  toggleSet: (setId: string) => Promise<void>
  updateSetFields: (setId: string, patch: Partial<Pick<ExerciseSet, 'actualReps' | 'weight' | 'rpe' | 'durationSeconds' | 'distanceMeters' | 'note' | 'unit'>>) => Promise<void>
  duplicateLastWeight: (exerciseId: string) => Promise<void>
  addExtraSet: (exerciseId: string) => Promise<void>
  resetSet: (setId: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useWorkoutSession(date: string, type: SessionType, storageReady: boolean, defaultUnit: WeightUnit): WorkoutSessionState & Actions {
  const [state, setState] = useState<WorkoutSessionState>({
    loading: true,
    error: null,
    session: null,
    plan: null,
    exercises: {},
    sets: [],
    setsByExercise: {},
    progress: { completed: 0, total: 0, percent: 0 },
  })

  const load = useCallback(async () => {
    if (!storageReady) return
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const planId = planIdFromType(type)
      const session = await getOrCreateSessionForDate(date, { date, type, status: 'pendiente', startedAt: null, completedAt: null })
      const plan = planId ? (await getPlan(planId)) ?? null : null
      const allExercises = await listExercises()
      const exerciseMap = Object.fromEntries(allExercises.map((e) => [e.id, e]))

      let sets = await getSetsBySession(session.id)
      if (sets.length === 0 && plan) {
        const scaffold = plan.exercises.flatMap((pe) =>
          Array.from({ length: pe.targetSets }, (_, i) => ({
            sessionId: session.id,
            exerciseId: pe.exerciseId,
            setIndex: i,
            targetReps: pe.targetReps,
            actualReps: null,
            weight: null,
            unit: defaultUnit,
            rpe: null,
            durationSeconds: null,
            distanceMeters: null,
            note: null,
            completed: false,
            completedAt: null,
          })),
        )
        sets = await seedSetsForSession(scaffold)
      }

      const setsByExercise: Record<string, ExerciseSet[]> = {}
      for (const set of sets) {
        ;(setsByExercise[set.exerciseId] ??= []).push(set)
      }
      for (const list of Object.values(setsByExercise)) list.sort((a, b) => a.setIndex - b.setIndex)

      const completed = sets.filter((s) => s.completed).length
      const total = sets.length
      setState({
        loading: false,
        error: null,
        session,
        plan,
        exercises: exerciseMap,
        sets,
        setsByExercise,
        progress: { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) },
      })
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : 'Error al cargar la sesión.' }))
    }
  }, [date, type, storageReady, defaultUnit])

  useEffect(() => {
    load()
  }, [load])

  const applySetPatch = useCallback(
    async (setId: string, patch: Partial<ExerciseSet>) => {
      const updated = await updateSetRepo(setId, patch)
      setState((s) => {
        const sets = s.sets.map((set) => (set.id === setId ? updated : set))
        const setsByExercise: Record<string, ExerciseSet[]> = {}
        for (const set of sets) (setsByExercise[set.exerciseId] ??= []).push(set)
        for (const list of Object.values(setsByExercise)) list.sort((a, b) => a.setIndex - b.setIndex)
        const completed = sets.filter((x) => x.completed).length
        const total = sets.length
        return { ...s, sets, setsByExercise, progress: { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) } }
      })
      return updated
    },
    [],
  )

  const toggleSet = useCallback(
    async (setId: string) => {
      const target = state.sets.find((s) => s.id === setId)
      if (!target) return
      const willComplete = !target.completed
      const updated = await applySetPatch(setId, { completed: willComplete, completedAt: willComplete ? nowIso() : null })

      if (willComplete && state.session) {
        if (updated.weight != null) {
          await maybeUpdateRecord({
            exerciseId: updated.exerciseId,
            type: 'max-weight',
            value: updated.weight,
            unit: updated.unit,
            date,
            sessionId: state.session.id,
            setId: updated.id,
          })
        }
        if (updated.actualReps != null) {
          await maybeUpdateRecord({
            exerciseId: updated.exerciseId,
            type: 'max-reps',
            value: updated.actualReps,
            unit: 'reps',
            date,
            sessionId: state.session.id,
            setId: updated.id,
          })
        }
        if (updated.weight != null && updated.actualReps != null) {
          await maybeUpdateRecord({
            exerciseId: updated.exerciseId,
            type: 'max-volume',
            value: updated.weight * updated.actualReps,
            unit: updated.unit,
            date,
            sessionId: state.session.id,
            setId: updated.id,
          })
        }
        if (updated.durationSeconds != null) {
          await maybeUpdateRecord({
            exerciseId: updated.exerciseId,
            type: 'best-time',
            value: updated.durationSeconds,
            unit: 'seconds',
            date,
            sessionId: state.session.id,
            setId: updated.id,
          })
        }
        if (state.session.status === 'pendiente') {
          const updatedSession = await updateSession(state.session.id, { status: 'en-progreso', startedAt: state.session.startedAt ?? nowIso() })
          setState((s) => ({ ...s, session: updatedSession }))
        }
      }
    },
    [state.sets, state.session, applySetPatch, date],
  )

  const updateSetFields = useCallback(
    async (setId: string, patch: Partial<Pick<ExerciseSet, 'actualReps' | 'weight' | 'rpe' | 'durationSeconds' | 'distanceMeters' | 'note' | 'unit'>>) => {
      await applySetPatch(setId, patch)
    },
    [applySetPatch],
  )

  const duplicateLastWeight = useCallback(
    async (exerciseId: string) => {
      const history = await getSetsByExercise(exerciseId)
      const previous = history
        .filter((s) => s.sessionId !== state.session?.id && s.weight != null)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      if (!previous) return
      const targets = state.setsByExercise[exerciseId] ?? []
      await Promise.all(targets.filter((s) => s.weight == null).map((s) => applySetPatch(s.id, { weight: previous.weight, unit: previous.unit })))
    },
    [state.session, state.setsByExercise, applySetPatch],
  )

  const addExtraSet = useCallback(
    async (exerciseId: string) => {
      if (!state.session) return
      const current = state.setsByExercise[exerciseId] ?? []
      const created = await createSet({
        sessionId: state.session.id,
        exerciseId,
        setIndex: current.length,
        targetReps: current[0]?.targetReps ?? null,
        actualReps: null,
        weight: null,
        unit: defaultUnit,
        rpe: null,
        durationSeconds: null,
        distanceMeters: null,
        note: null,
        completed: false,
        completedAt: null,
      })
      setState((s) => {
        const sets = [...s.sets, created]
        const setsByExercise = { ...s.setsByExercise, [exerciseId]: [...(s.setsByExercise[exerciseId] ?? []), created] }
        return { ...s, sets, setsByExercise, progress: { ...s.progress, total: s.progress.total + 1 } }
      })
    },
    [state.session, state.setsByExercise, defaultUnit],
  )

  const resetSet = useCallback(
    async (setId: string) => {
      await applySetPatch(setId, { completed: false, completedAt: null, actualReps: null, weight: null, rpe: null, durationSeconds: null, distanceMeters: null, note: null })
    },
    [applySetPatch],
  )

  return useMemo(
    () => ({ ...state, toggleSet, updateSetFields, duplicateLastWeight, addExtraSet, resetSet, refresh: load }),
    [state, toggleSet, updateSetFields, duplicateLastWeight, addExtraSet, resetSet, load],
  )
}
