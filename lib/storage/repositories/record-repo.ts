import { getAll, getByIndex, putOne } from '../db'
import { createId, nowIso } from '../ids'
import type { PersonalRecord, PersonalRecordInput } from '@/types'

const STORE = 'records' as const

export async function listRecords(): Promise<PersonalRecord[]> {
  return getAll<PersonalRecord>(STORE)
}

export async function getRecordsByExercise(exerciseId: string): Promise<PersonalRecord[]> {
  return getByIndex<PersonalRecord>(STORE, 'byExerciseId', exerciseId)
}

/** Replaces the record for (exerciseId, type) only if the new value beats the stored one. */
export async function maybeUpdateRecord(input: PersonalRecordInput): Promise<PersonalRecord | null> {
  const existing = await getRecordsByExercise(input.exerciseId)
  const current = existing.find((r) => r.type === input.type)
  if (current && current.value >= input.value) return null

  const record: PersonalRecord = { ...input, id: current?.id ?? createId('pr'), createdAt: nowIso() }
  await putOne(STORE, record)
  return record
}
