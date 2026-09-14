import { deleteOne, getAll, getByIndex, getOne, putMany, putOne } from '../db'
import { createId, nowIso } from '../ids'
import type { ExerciseSet, ExerciseSetInput } from '@/types'

const STORE = 'sets' as const

export async function listAllSets(): Promise<ExerciseSet[]> {
  return getAll<ExerciseSet>(STORE)
}

export async function getSetsBySession(sessionId: string): Promise<ExerciseSet[]> {
  const sets = await getByIndex<ExerciseSet>(STORE, 'bySessionId', sessionId)
  return sets.sort((a, b) => a.setIndex - b.setIndex)
}

export async function getSetsByExercise(exerciseId: string): Promise<ExerciseSet[]> {
  const sets = await getByIndex<ExerciseSet>(STORE, 'byExerciseId', exerciseId)
  return sets.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function createSet(input: ExerciseSetInput): Promise<ExerciseSet> {
  const timestamp = nowIso()
  const set: ExerciseSet = { ...input, id: createId('set'), createdAt: timestamp, updatedAt: timestamp }
  await putOne(STORE, set)
  return set
}

export async function seedSetsForSession(sets: ExerciseSetInput[]): Promise<ExerciseSet[]> {
  const timestamp = nowIso()
  const withIds = sets.map((s) => ({ ...s, id: createId('set'), createdAt: timestamp, updatedAt: timestamp }))
  await putMany(STORE, withIds)
  return withIds
}

export async function updateSet(id: string, patch: Partial<ExerciseSetInput>): Promise<ExerciseSet> {
  const existing = await getOne<ExerciseSet>(STORE, id)
  if (!existing) throw new Error(`Serie no encontrada: ${id}`)
  const updated: ExerciseSet = { ...existing, ...patch, id, updatedAt: nowIso() }
  await putOne(STORE, updated)
  return updated
}

export async function deleteSet(id: string): Promise<void> {
  await deleteOne(STORE, id)
}
