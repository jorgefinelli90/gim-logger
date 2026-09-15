import { deleteOne, getAll, getByIndex, getOne, putMany, putOne } from '../db'
import { nowIso } from '../ids'
import type { ExerciseSet, ExerciseSetInput } from '@/types'

const STORE = 'sets' as const

/**
 * Id DETERMINÍSTICO a partir de (sesión, ejercicio, número de serie) — nunca
 * al azar. Mismo motivo que `sessionIdFor` en `session-repo.ts`.
 *
 * El caso real que esto arregla: `useWorkoutSession.load()` arma las series de
 * un ejercicio la primera vez que se abre (lee cuáles ya existen, crea las que
 * faltan). Si `load()` se dispara dos veces seguidas antes de que la primera
 * tanda termine de guardarse — típicamente porque llega una sincronización a
 * mitad de camino y `useSyncRefresh` vuelve a llamar `load()` — la segunda
 * corrida lee el estado de ANTES de la primera escritura, no ve nada
 * scaffolded todavía, y arma OTRA tanda completa. Con id al azar eso son
 * series duplicadas de verdad (4 filas para una serie que pediste 1 vez); acá
 * ya pasó, en una sesión real, con las 24 series de un día entero. Con un id
 * determinístico, las dos tandas "duplicadas" son en rigor la MISMA fila
 * (mismo id), así que la segunda escritura simplemente pisa a la primera en
 * vez de sumarse.
 */
function setIdFor(sessionId: string, exerciseId: string, setIndex: number): string {
  return `set-${sessionId}-${exerciseId}-${setIndex}`
}

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
  const id = setIdFor(input.sessionId, input.exerciseId, input.setIndex)
  const set: ExerciseSet = { ...input, id, createdAt: timestamp, updatedAt: timestamp }
  await putOne(STORE, set)
  return set
}

export async function seedSetsForSession(sets: ExerciseSetInput[]): Promise<ExerciseSet[]> {
  const timestamp = nowIso()
  const withIds = sets.map((s) => ({ ...s, id: setIdFor(s.sessionId, s.exerciseId, s.setIndex), createdAt: timestamp, updatedAt: timestamp }))
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
