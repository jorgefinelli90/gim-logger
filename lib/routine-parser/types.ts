export interface RawExercise {
  id: string
  order: number
  muscleGroupRaw: string
  name: string
  targetSets: number | null
  targetReps: string | null
  setsRepsRaw: string | null
  targetWeightByWeek: [number | null, number | null, number | null, number | null]
  restSeconds: number | null
  restRaw: string | null
  benefit: string | null
  tip: string | null
}

export interface RawDay {
  dayNumber: number
  title: string
  subtitle: string
  exercises: RawExercise[]
}

export interface RawRoutineFile {
  schemaVersion: number
  generatedAt: string
  sourceFile: string
  sourceSheet: string
  days: RawDay[]
}

export interface CatalogEntry {
  key: string
  name: string
  muscleGroupRaw: string
  matched: boolean
  matchMethod: 'override' | 'fuzzy' | 'none-honest' | null
  matchScore: number
  catalogSlug: string | null
  catalogName: string | null
  muscle: string | null
  equipment: string | null
  bodyPart: string | null
  instructions: string[]
  gifUrl: string | null
  thumbUrl: string | null
}

export interface CatalogFile {
  schemaVersion: number
  generatedAt: string
  cdnBase: string
  entries: CatalogEntry[]
}
