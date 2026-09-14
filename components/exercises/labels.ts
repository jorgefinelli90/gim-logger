import type { ExerciseCategory, MuscleGroup, TrackingMode } from '@/types'

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebrazos: 'Antebrazos',
  piernas: 'Piernas',
  gluteos: 'Glúteos',
  abdominales: 'Abdominales',
  pantorrillas: 'Pantorrillas',
  'cuerpo-completo': 'Cuerpo completo',
  cardio: 'Cardio',
  otro: 'Otro',
}

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  gimnasio: 'Gimnasio',
  calistenia: 'Calistenia',
  movilidad: 'Movilidad',
}

export const TRACKING_LABELS: Record<TrackingMode, string> = {
  reps: 'Repeticiones',
  time: 'Tiempo',
  distance: 'Distancia',
}
