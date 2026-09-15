import { deleteOne, getAll, getOne, putOne } from '../db'
import { createId, nowIso } from '../ids'
import type { Exercise, ExerciseInput, Profile } from '@/types'

const STORE = 'exercises' as const

/** Todos los ejercicios de un perfil. El dataset es chico (decenas de filas
 *  por persona), así que filtrar en memoria después de leer todo es más
 *  simple y suficientemente rápido que mantener un índice por perfil. */
export async function listExercises(profile: Profile): Promise<Exercise[]> {
  const all = await getAll<Exercise>(STORE)
  return all.filter((e) => e.profile === profile).sort((a, b) => a.order - b.order)
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
  // `track: false`: la semilla sale del Excel del repo y es idéntica en todos
  // los dispositivos, así que no es "un cambio mío". Si se encolara, vincular
  // un teléfono nuevo subiría la versión recién sembrada y borraría del
  // servidor el GIF personalizado o el nombre que hubieras editado.
  await Promise.all(missing.map((exercise) => putOne(STORE, exercise, false)))
}
