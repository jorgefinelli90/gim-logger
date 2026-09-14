import { getAll, getByIndex, getOne, putOne } from '../db'
import { createId, nowIso } from '../ids'
import type { WorkoutSession, WorkoutSessionInput } from '@/types'

const STORE = 'sessions' as const

export async function listSessions(): Promise<WorkoutSession[]> {
  return getAll<WorkoutSession>(STORE)
}

export async function getSession(id: string): Promise<WorkoutSession | undefined> {
  return getOne<WorkoutSession>(STORE, id)
}

export async function getSessionsByDate(date: string): Promise<WorkoutSession[]> {
  return getByIndex<WorkoutSession>(STORE, 'byDate', date)
}

export async function getOrCreateSessionForDate(date: string, input: WorkoutSessionInput): Promise<WorkoutSession> {
  const existing = await getSessionsByDate(date)
  const sameType = existing.find((s) => s.type === input.type)
  if (sameType) return sameType

  const timestamp = nowIso()
  const session: WorkoutSession = { ...input, id: createId('session'), createdAt: timestamp, updatedAt: timestamp }
  await putOne(STORE, session)
  return session
}

export async function updateSession(id: string, patch: Partial<WorkoutSessionInput>): Promise<WorkoutSession> {
  const existing = await getSession(id)
  if (!existing) throw new Error(`Sesión no encontrada: ${id}`)
  const updated: WorkoutSession = { ...existing, ...patch, id, updatedAt: nowIso() }
  await putOne(STORE, updated)
  return updated
}
