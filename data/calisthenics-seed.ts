/**
 * Initial calisthenics list — editable from day one (add/edit/delete/reorder
 * in the app). These 4 movements and their prescriptions come from the
 * original app content already authored in this repo; nothing invented.
 */
export interface CalisthenicsSeedItem {
  key: string
  name: string
  muscleGroupRaw: string
  targetSets: number
  targetReps: string | null
  trackingMode: 'reps' | 'time'
  restSeconds: number
}

export const CALISTHENICS_SEED: CalisthenicsSeedItem[] = [
  {
    key: 'calistenia-flexiones',
    name: 'Flexiones',
    muscleGroupRaw: 'EMPUJE',
    targetSets: 4,
    targetReps: 'Al fallo técnico',
    trackingMode: 'reps',
    restSeconds: 90,
  },
  {
    key: 'calistenia-dominadas',
    name: 'Dominadas o remo invertido',
    muscleGroupRaw: 'TIRÓN',
    targetSets: 4,
    targetReps: 'Al fallo técnico',
    trackingMode: 'reps',
    restSeconds: 120,
  },
  {
    key: 'calistenia-sentadillas',
    name: 'Sentadillas con peso corporal',
    muscleGroupRaw: 'PIERNAS',
    targetSets: 4,
    targetReps: '15-20 reps',
    trackingMode: 'reps',
    restSeconds: 60,
  },
  {
    key: 'calistenia-plancha',
    name: 'Plancha frontal',
    muscleGroupRaw: 'CORE',
    targetSets: 3,
    targetReps: '30-60 segundos',
    trackingMode: 'time',
    restSeconds: 60,
  },
]
