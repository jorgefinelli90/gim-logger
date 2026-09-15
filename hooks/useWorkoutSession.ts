'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Exercise, ExerciseSet, PlanDayId, Profile, SessionType, WeightUnit, WorkoutPlan, WorkoutSession } from '@/types'
import { getOrCreateSessionForDate, updateSession } from '@/lib/storage/repositories/session-repo'
import { getSetsBySession, createSet, updateSet as updateSetRepo, deleteSet, getSetsByExercise, seedSetsForSession } from '@/lib/storage/repositories/set-repo'
import { getPlan } from '@/lib/storage/repositories/plan-repo'
import { listExercises } from '@/lib/storage/repositories/exercise-repo'
import { maybeUpdateRecord } from '@/lib/storage/repositories/record-repo'
import { nowIso } from '@/lib/storage/ids'
import { useSyncRefresh } from '@/lib/sync/notify'
import { useSync } from '@/components/sync/SyncProvider'

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
  removeLastSet: (exerciseId: string) => Promise<void>
  resetSet: (setId: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useWorkoutSession(profile: Profile, date: string, type: SessionType, storageReady: boolean, defaultUnit: WeightUnit): WorkoutSessionState & Actions {
  // Recarga la sesión cuando llegan series registradas desde otro dispositivo.
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

  // Distingue la corrida MÁS RECIENTE de `load()` de cualquier otra que haya
  // quedado en vuelo. `useSyncRefresh` puede disparar una corrida nueva
  // mientras la anterior todavía está armando las series (scaffold) — sin
  // esto, la que responde último "gana" aunque haya arrancado antes, y podría
  // pisar el estado con datos viejos. Los ids determinísticos de las series
  // (ver `set-repo.ts`) ya evitan que eso duplique filas; esto además evita
  // que se vea un parpadeo hacia atrás en pantalla.
  const loadTokenRef = useRef(0)
  const { initialSyncDone } = useSync()

  const load = useCallback(async () => {
    if (!storageReady) return
    const token = ++loadTokenRef.current
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const planId = planIdFromType(type)
      const session = await getOrCreateSessionForDate(date, {
        profile,
        date,
        type,
        status: 'pendiente',
        // No se marca primaria acá: crear/abrir una sesión (incluido "recuperar"
        // un día puntual desde /rutinas) no debe pisar el día que el dashboard
        // está mostrando como "el de hoy". Eso solo lo cambia una acción
        // explícita — ver `useEffectiveSessionType`.
        isPrimaryForDate: false,
        startedAt: null,
        completedAt: null,
      })
      const plan = planId ? (await getPlan(profile, planId)) ?? null : null
      const allExercises = await listExercises(profile)
      const exerciseMap = Object.fromEntries(allExercises.map((e) => [e.id, e]))

      let sets = await getSetsBySession(session.id)
      // Esperar la primera bajada antes de armar lo que "falta": un
      // dispositivo recién entrado todavía no sabe si faltan de verdad o si
      // alguien ya las sacó desde otro aparato — armarlas antes de tiempo
      // resucitaría ese borrado en cuanto este dispositivo suba lo suyo. Ver
      // `initialSyncDone` en SyncProvider. Mientras tanto se muestra lo que ya
      // haya localmente (puede ser nada, un instante) y `useSyncRefresh` +
      // este mismo cambio de bandera vuelven a llamar `load()` en cuanto esté
      // lista la bajada.
      if (plan && initialSyncDone) {
        // Scaffold per plan-exercise, not all-or-nothing: an exercise added to
        // the plan mid-session needs its set rows created too.
        const alreadyScaffolded = new Set(sets.map((s) => s.exerciseId))
        const scaffold = plan.exercises
          .filter((pe) => !alreadyScaffolded.has(pe.exerciseId))
          .flatMap((pe) =>
            Array.from({ length: pe.targetSets }, (_, i) => ({
              profile,
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
        if (scaffold.length > 0) {
          sets = [...sets, ...(await seedSetsForSession(scaffold))]
        }
      }

      const setsByExercise: Record<string, ExerciseSet[]> = {}
      for (const set of sets) {
        ;(setsByExercise[set.exerciseId] ??= []).push(set)
      }
      for (const list of Object.values(setsByExercise)) list.sort((a, b) => a.setIndex - b.setIndex)

      const completed = sets.filter((s) => s.completed).length
      const total = sets.length
      // Si mientras tanto arrancó otra corrida más nueva, esta ya no cuenta.
      if (loadTokenRef.current !== token) return
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
      if (loadTokenRef.current !== token) return
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : 'Error al cargar la sesión.' }))
    }
  }, [profile, date, type, storageReady, defaultUnit, initialSyncDone])

  useEffect(() => {
    load()
  }, [load])

  useSyncRefresh(load)

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
            profile,
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
            profile,
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
            profile,
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
            profile,
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
    [state.sets, state.session, applySetPatch, profile, date],
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
        profile,
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
    [state.session, state.setsByExercise, profile, defaultUnit],
  )

  const removeLastSet = useCallback(
    async (exerciseId: string) => {
      const current = state.setsByExercise[exerciseId] ?? []
      // Nunca deja el ejercicio en cero series: para eso ya existe ocultarlo
      // desde la rutina. "− Serie" es para ajustar la cantidad, no para vaciarlo.
      if (current.length <= 1) return
      const last = current[current.length - 1]
      await deleteSet(last.id)
      setState((s) => {
        const sets = s.sets.filter((x) => x.id !== last.id)
        const setsByExercise = { ...s.setsByExercise, [exerciseId]: (s.setsByExercise[exerciseId] ?? []).filter((x) => x.id !== last.id) }
        const completed = sets.filter((x) => x.completed).length
        const total = sets.length
        return { ...s, sets, setsByExercise, progress: { completed, total, percent: total === 0 ? 0 : Math.round((completed / total) * 100) } }
      })
    },
    [state.setsByExercise],
  )

  const resetSet = useCallback(
    async (setId: string) => {
      await applySetPatch(setId, { completed: false, completedAt: null, actualReps: null, weight: null, rpe: null, durationSeconds: null, distanceMeters: null, note: null })
    },
    [applySetPatch],
  )

  return useMemo(
    () => ({ ...state, toggleSet, updateSetFields, duplicateLastWeight, addExtraSet, removeLastSet, resetSet, refresh: load }),
    [state, toggleSet, updateSetFields, duplicateLastWeight, addExtraSet, removeLastSet, resetSet, load],
  )
}
