export type ExerciseCategory = 'gimnasio' | 'calistenia' | 'movilidad'

export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'antebrazos'
  | 'piernas'
  | 'gluteos'
  | 'abdominales'
  | 'pantorrillas'
  | 'cuerpo-completo'
  | 'cardio'
  | 'otro'

export type TrackingMode = 'reps' | 'time' | 'distance'

export interface ExerciseImage {
  /** URL served from the ExerciseGymGifsDB CDN (jsDelivr), never stored locally. */
  gifUrl: string | null
  /** User-provided override URL, takes precedence over gifUrl. */
  customUrl: string | null
  sourceSlug: string | null
}

export interface Exercise {
  id: string
  name: string
  aliases: string[]
  muscleGroup: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  category: ExerciseCategory
  trackingMode: TrackingMode
  equipment: string[]
  instructions: string[]
  commonMistakes: string[]
  alternatives: string[]
  image: ExerciseImage
  hidden: boolean
  isCustom: boolean
  source: 'excel' | 'catalog' | 'custom'
  order: number
  createdAt: string
  updatedAt: string
}

export type ExerciseInput = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>
