export interface DailyNote {
  id: string
  /** ISO date (yyyy-mm-dd). One note per day. */
  date: string
  general: string
  energyLevel: number | null // 1-5
  mood: number | null // 1-5
  soreness: string | null
  createdAt: string
  updatedAt: string
}

export type DailyNoteInput = Omit<DailyNote, 'id' | 'createdAt' | 'updatedAt'>
