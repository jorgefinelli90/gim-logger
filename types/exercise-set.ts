import type { Profile } from './profile'

export type WeightUnit = 'kg' | 'lb'

export interface ExerciseSet {
  id: string
  profile: Profile
  sessionId: string
  exerciseId: string
  setIndex: number
  targetReps: string | null
  actualReps: number | null
  weight: number | null
  unit: WeightUnit
  rpe: number | null
  durationSeconds: number | null
  distanceMeters: number | null
  note: string | null
  completed: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ExerciseSetInput = Omit<ExerciseSet, 'id' | 'createdAt' | 'updatedAt'>
