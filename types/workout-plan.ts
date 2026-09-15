import type { Profile } from './profile'

/**
 * Identidad LÓGICA de un día de rutina — genérica entre perfiles. Jorge tiene
 * 3 días de gimnasio + calistenia; Sebastián tiene 4 días de gimnasio y no usa
 * calistenia. Qué días existen para cada perfil vive en
 * `lib/date/profile-schedule.ts`, no acá.
 */
export type PlanDayId = 'gimnasio-dia-1' | 'gimnasio-dia-2' | 'gimnasio-dia-3' | 'gimnasio-dia-4' | 'calistenia'

export interface PlanExercise {
  id: string
  exerciseId: string
  order: number
  targetSets: number
  targetReps: string | null
  /** kg target per mesocycle week (1-4), null when not configured yet (Excel left it blank). */
  targetWeightByWeek: [number | null, number | null, number | null, number | null]
  restSeconds: number | null
  notes: string | null
}

export interface WorkoutPlan {
  /**
   * Clave de almacenamiento, globalmente única. Para Jorge coincide con
   * `dayId` tal cual (así su historial guardado antes del multiusuario no
   * cambia de id); para cualquier otro perfil lleva el prefijo del perfil
   * (`sebas-gimnasio-dia-1`) para no chocar con la de Jorge. Ver
   * `lib/storage/plan-id.ts`.
   */
  id: string
  /** Identidad lógica del día (`gimnasio-dia-1`, `calistenia`, …), la que usan las rutas y `WorkoutSession.type`. */
  dayId: PlanDayId
  profile: Profile
  title: string
  subtitle: string
  type: 'gimnasio' | 'calistenia'
  exercises: PlanExercise[]
  updatedAt: string
}
