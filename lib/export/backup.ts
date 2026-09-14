import type { BodyMetric, DailyNote, Exercise, ExerciseSet, PersonalRecord, UserPreferences, WorkoutPlan, WorkoutSession } from '@/types'
import { getAll, putMany, clearAllStores } from '@/lib/storage/db'
import { loadPreferences, savePreferences } from '@/lib/storage/preferences'

export const BACKUP_SCHEMA_VERSION = 1

export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  preferences: UserPreferences
  exercises: Exercise[]
  plans: WorkoutPlan[]
  sessions: WorkoutSession[]
  sets: ExerciseSet[]
  notes: DailyNote[]
  bodyMetrics: BodyMetric[]
  records: PersonalRecord[]
}

export async function buildBackup(): Promise<BackupPayload> {
  const [exercises, plans, sessions, sets, notes, bodyMetrics, records] = await Promise.all([
    getAll<Exercise>('exercises'),
    getAll<WorkoutPlan>('plans'),
    getAll<WorkoutSession>('sessions'),
    getAll<ExerciseSet>('sets'),
    getAll<DailyNote>('notes'),
    getAll<BodyMetric>('bodyMetrics'),
    getAll<PersonalRecord>('records'),
  ])
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    preferences: loadPreferences(),
    exercises,
    plans,
    sessions,
    sets,
    notes,
    bodyMetrics,
    records,
  }
}

export type ValidationResult = { valid: true; data: BackupPayload } | { valid: false; error: string }

function isArrayOfRecords(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((item) => item && typeof item === 'object' && 'id' in item)
}

/** Hand-written structural validation — no schema library, the shape is small and stable. */
export function validateBackupPayload(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') return { valid: false, error: 'El archivo no contiene un objeto JSON válido.' }
  const obj = raw as Record<string, unknown>

  if (typeof obj.schemaVersion !== 'number') return { valid: false, error: 'Falta la versión del esquema (schemaVersion).' }
  if (!obj.preferences || typeof obj.preferences !== 'object') return { valid: false, error: 'Falta el objeto de preferencias.' }

  const collections: (keyof BackupPayload)[] = ['exercises', 'plans', 'sessions', 'sets', 'notes', 'bodyMetrics', 'records']
  for (const key of collections) {
    if (!isArrayOfRecords(obj[key])) {
      return { valid: false, error: `El campo "${key}" debe ser una lista de registros con id.` }
    }
  }

  return { valid: true, data: obj as unknown as BackupPayload }
}

/** Replaces ALL local data with the imported payload. Caller must confirm with the user first. */
export async function importBackup(payload: BackupPayload): Promise<void> {
  await clearAllStores()
  await Promise.all([
    putMany('exercises', payload.exercises),
    putMany('plans', payload.plans),
    putMany('sessions', payload.sessions),
    putMany('sets', payload.sets),
    putMany('notes', payload.notes),
    putMany('bodyMetrics', payload.bodyMetrics),
    putMany('records', payload.records),
  ])
  savePreferences(payload.preferences)
}
