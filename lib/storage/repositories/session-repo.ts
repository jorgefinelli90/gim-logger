import { getAll, getByIndex, getOne, putOne } from '../db'
import { nowIso } from '../ids'
import type { Profile, SessionType, WorkoutSession, WorkoutSessionInput } from '@/types'

const STORE = 'sessions' as const

/**
 * Id DETERMINÍSTICO a partir de (perfil, fecha, tipo) — nunca al azar.
 *
 * Por qué importa: (perfil, fecha, tipo) ya es, por diseño, una clave única
 * — nunca debería haber dos sesiones de "gimnasio-día-1" de Jorge el mismo
 * día. Con un id al azar (`createId('session')`), si el celular y la compu
 * abren esa rutina el mismo día ANTES de sincronizar entre sí, cada uno crea
 * su propia fila con un id distinto; al subir las dos, el servidor termina
 * con dos sesiones "gemelas" en vez de una, y cada dispositivo se queda
 * viendo la suya — la serie marcada en el celular nunca aparece en la compu
 * aunque las dos estén bien sincronizadas, porque en rigor NO son la misma
 * fila. Con un id determinístico, los dos dispositivos generan exactamente
 * el mismo id sin coordinarse, así que el upsert del sync las funde en una
 * sola sesión en vez de duplicarla.
 */
function sessionIdFor(profile: Profile, date: string, type: SessionType): string {
  return `session-${profile}-${date}-${type}`
}

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
  // Primero por id determinístico: si otro dispositivo ya la creó y
  // sincronizó, está guardada bajo este mismo id exacto, sin coordinarse.
  const id = sessionIdFor(input.profile, date, input.type)
  const byDeterministicId = await getSession(id)
  if (byDeterministicId) return byDeterministicId

  // Antes de este cambio los ids eran al azar (`createId('session')`) — una
  // sesión creada por una versión vieja de la app (o ya sincronizada desde
  // otro dispositivo con la versión vieja) sigue viva bajo ESE id. Hay que
  // seguir encontrándola por (perfil, fecha, tipo) para no crearle una
  // gemela con el id nuevo: eso duplicaría exactamente lo que este cambio
  // busca evitar.
  const existing = await getSessionsForProfileAndDate(input.profile, date)
  const legacyMatch = existing.find((s) => s.type === input.type)
  if (legacyMatch) return legacyMatch

  const timestamp = nowIso()
  const session: WorkoutSession = { ...input, id, createdAt: timestamp, updatedAt: timestamp }
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
