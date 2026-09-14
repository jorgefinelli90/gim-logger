export type PlanDayId = 'gimnasio-dia-1' | 'gimnasio-dia-2' | 'gimnasio-dia-3' | 'calistenia'

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
  id: PlanDayId
  title: string
  subtitle: string
  type: 'gimnasio' | 'calistenia'
  exercises: PlanExercise[]
  updatedAt: string
}
