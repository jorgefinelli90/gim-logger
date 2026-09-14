import { deleteOne, getAll, getOne, putOne } from '../db'
import { createId, nowIso } from '../ids'
import type { Exercise, ExerciseInput } from '@/types'

const STORE = 'exercises' as const

export async function listExercises(): Promise<Exercise[]> {
  const all = await getAll<Exercise>(STORE)
  return all.sort((a, b) => a.order - b.order)
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  return getOne<Exercise>(STORE, id)
}

export async function createExercise(input: ExerciseInput): Promise<Exercise> {
  const timestamp = nowIso()
  const exercise: Exercise = { ...input, id: createId('ex'), createdAt: timestamp, updatedAt: timestamp }
  await putOne(STORE, exercise)
  return exercise
}

export async function upsertExercise(exercise: Exercise): Promise<void> {
  await putOne(STORE, exercise)
}

export async function updateExercise(id: string, patch: Partial<ExerciseInput>): Promise<Exercise> {
  const existing = await getExercise(id)
  if (!existing) throw new Error(`Ejercicio no encontrado: ${id}`)
  const updated: Exercise = { ...existing, ...patch, id, updatedAt: nowIso() }
  await putOne(STORE, updated)
  return updated
}

export async function deleteExercise(id: string): Promise<void> {
  await deleteOne(STORE, id)
}

export async function seedExercisesIfMissing(exercises: Exercise[]): Promise<void> {
  const existing = await getAll<Exercise>(STORE)
  const existingIds = new Set(existing.map((e) => e.id))
  const missing = exercises.filter((e) => !existingIds.has(e.id))
  await Promise.all(missing.map((exercise) => putOne(STORE, exercise)))
}
