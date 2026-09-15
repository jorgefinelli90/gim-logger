import type { PlanDayId } from './workout-plan'
import type { Profile } from './profile'

export type SessionType = PlanDayId | 'descanso'

export type SessionStatus = 'pendiente' | 'en-progreso' | 'completo'

export interface WorkoutSession {
  id: string
  profile: Profile
  /** ISO date (yyyy-mm-dd), local calendar day. */
  date: string
  type: SessionType
  status: SessionStatus
  /**
   * Un mismo (perfil, fecha) puede tener varias sesiones (por ejemplo, si se
   * entra a "recuperar" el día 2 desde /rutinas aunque hoy tocaba día 1). Esta
   * marca dice cuál de ellas es "la sesión de hoy" a mostrar en el dashboard —
   * es lo que hace posible cambiar de rutina un día puntual sin tocar el
   * horario semanal. Ver `hooks/useEffectiveSessionType.ts`.
   */
  isPrimaryForDate: boolean
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type WorkoutSessionInput = Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>
