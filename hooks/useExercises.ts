'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Exercise, ExerciseInput, Profile } from '@/types'
import { createExercise, deleteExercise, listExercises, updateExercise } from '@/lib/storage/repositories/exercise-repo'
import { useSyncRefresh } from '@/lib/sync/notify'

export function useExercises(profile: Profile, storageReady: boolean) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!storageReady) return
    setLoading(true)
    try {
      setExercises(await listExercises(profile))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los ejercicios.')
    } finally {
      setLoading(false)
    }
  }, [profile, storageReady])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Se relee cuando el sync baja cambios hechos en otro dispositivo.
  useSyncRefresh(refresh)

  const add = useCallback(
    async (input: ExerciseInput) => {
      const created = await createExercise(input)
      setExercises((prev) => [...prev, created].sort((a, b) => a.order - b.order))
      return created
    },
    [],
  )

  const edit = useCallback(async (id: string, patch: Partial<ExerciseInput>) => {
    const updated = await updateExercise(id, patch)
    setExercises((prev) => prev.map((e) => (e.id === id ? updated : e)))
    return updated
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteExercise(id)
    setExercises((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { exercises, loading, error, refresh, add, edit, remove }
}
