import { getAll, getByIndex, getOne, putOne } from '../db'
import { createId, nowIso } from '../ids'
import type { Profile, WorkoutSession, WorkoutSessionInput } from '@/types'

const STORE = 'sessions' as const

export async function listSessions(): Promise<WorkoutSession[]> {
  return getAll<WorkoutSession>(STORE)
}

export async function getSession(id: string): Promise<WorkoutSession | undefined> {
  return getOne<WorkoutSession>(STORE, id)
}

/** Todas las sesiones de esa fecha, de CUALQUIER perfil — usar
 *  `getSessionsForProfileAndDate` salvo que de verdad haga falta ver ambas. */
export async function getSessionsByDate(date: string): Promise<WorkoutSession[]> {
  return getByIndex<WorkoutSession>(STORE, 'byDate', date)
}

export async function getSessionsForProfileAndDate(profile: Profile, date: string): Promise<WorkoutSession[]> {
  const sessions = await getSessionsByDate(date)
  return sessions.filter((s) => s.profile === profile)
}

export async function getOrCreateSessionForDate(date: string, input: WorkoutSessionInput): Promise<WorkoutSession> {
  // Filtra por perfil ADEMÁS de tipo: Jorge y Sebas pueden tener cada uno una
  // sesión "gimnasio-dia-1" la misma fecha real, y son sesiones distintas.
  const existing = await getSessionsForProfileAndDate(input.profile, date)
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

/**
 * Marca `sessionId` como "la sesión de hoy" para (perfil, fecha) y desmarca
 * cualquier otra — es lo que implementa "cambiar la rutina de hoy": no se
 * borra ni se reescribe ninguna sesión, solo cambia cuál se muestra como
 * principal en el dashboard/calendario.
 */
export async function setPrimarySessionForDate(profile: Profile, date: string, sessionId: string): Promise<void> {
  const sessions = await getSessionsForProfileAndDate(profile, date)
  await Promise.all(
    sessions
      .filter((s) => s.isPrimaryForDate !== (s.id === sessionId))
      .map((s) => updateSession(s.id, { isPrimaryForDate: s.id === sessionId })),
  )
}
