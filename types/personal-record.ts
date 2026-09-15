import type { Profile } from './profile'

export type PersonalRecordType = 'max-weight' | 'max-reps' | 'max-volume' | 'best-time'

export interface PersonalRecord {
  id: string
  profile: Profile
  exerciseId: string
  type: PersonalRecordType
  value: number
  unit: WeightUnitOrNull
  date: string
  sessionId: string
  setId: string
  createdAt: string
}

type WeightUnitOrNull = 'kg' | 'lb' | 'reps' | 'seconds' | null

export type PersonalRecordInput = Omit<PersonalRecord, 'id' | 'createdAt'>
