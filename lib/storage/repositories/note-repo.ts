import { getByIndex, putOne } from '../db'
import { createId, nowIso } from '../ids'
import type { DailyNote, DailyNoteInput, Profile } from '@/types'

const STORE = 'notes' as const

export async function getNoteByDate(profile: Profile, date: string): Promise<DailyNote | undefined> {
  // El índice `byDate` ya no es único (dos perfiles pueden anotar el mismo
  // día), así que hay que filtrar acá en vez de tomar el primer resultado.
  const notes = await getByIndex<DailyNote>(STORE, 'byDate', date)
  return notes.find((n) => n.profile === profile)
}

export async function upsertNoteForDate(profile: Profile, date: string, patch: Partial<DailyNoteInput>): Promise<DailyNote> {
  const existing = await getNoteByDate(profile, date)
  const timestamp = nowIso()
  const base: DailyNote = existing ?? {
    id: createId('note'),
    profile,
    date,
    general: '',
    energyLevel: null,
    mood: null,
    soreness: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const updated: DailyNote = { ...base, ...patch, profile, date, updatedAt: timestamp }
  await putOne(STORE, updated)
  return updated
}
