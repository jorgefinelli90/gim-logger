import { getAll, getByIndex, putOne } from '../db'
import { createId, nowIso } from '../ids'
import type { DailyNote, DailyNoteInput } from '@/types'

const STORE = 'notes' as const

export async function listNotes(): Promise<DailyNote[]> {
  return getAll<DailyNote>(STORE)
}

export async function getNoteByDate(date: string): Promise<DailyNote | undefined> {
  const [note] = await getByIndex<DailyNote>(STORE, 'byDate', date)
  return note
}

export async function upsertNoteForDate(date: string, patch: Partial<DailyNoteInput>): Promise<DailyNote> {
  const existing = await getNoteByDate(date)
  const timestamp = nowIso()
  const base: DailyNote = existing ?? {
    id: createId('note'),
    date,
    general: '',
    energyLevel: null,
    mood: null,
    soreness: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const updated: DailyNote = { ...base, ...patch, date, updatedAt: timestamp }
  await putOne(STORE, updated)
  return updated
}
