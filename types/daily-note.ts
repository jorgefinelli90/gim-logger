import type { Profile } from './profile'

export interface DailyNote {
  id: string
  profile: Profile
  /** ISO date (yyyy-mm-dd). One note per (profile, date) — Jorge and Sebas can each have their own note the same day. */
  date: string
  general: string
  energyLevel: number | null // 1-5
  mood: number | null // 1-5
  soreness: string | null
  createdAt: string
  updatedAt: string
}

export type DailyNoteInput = Omit<DailyNote, 'id' | 'createdAt' | 'updatedAt'>
