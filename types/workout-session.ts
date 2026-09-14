import type { PlanDayId } from './workout-plan'

export type SessionType = PlanDayId | 'descanso'

export type SessionStatus = 'pendiente' | 'en-progreso' | 'completo'

export interface WorkoutSession {
  id: string
  /** ISO date (yyyy-mm-dd), local calendar day. */
  date: string
  type: SessionType
  status: SessionStatus
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type WorkoutSessionInput = Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>
