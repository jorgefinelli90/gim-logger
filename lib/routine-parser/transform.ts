import type { Exercise, PlanExercise, WorkoutPlan } from '@/types'
import type { CalisthenicsSeedItem } from '@/data/calisthenics-seed'
import type { CatalogEntry, CatalogFile, RawRoutineFile } from './types'

const MUSCLE_GROUP_MAP: Record<string, Exercise['muscleGroup']> = {
  PECHO: 'pecho',
  ESPALDA: 'espalda',
  HOMBROS: 'hombros',
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  TRICPES: 'triceps', // typo present in the source spreadsheet
  ANTEBRAZOS: 'antebrazos',
  PIERNAS: 'piernas',
  GLUTEOS: 'gluteos',
  ABDOMINALES: 'abdominales',
  PANTORRILLAS: 'pantorrillas',
  EMPUJE: 'pecho',
  TIRON: 'espalda',
  CORE: 'abdominales',
}

export function mapMuscleGroup(raw: string): Exercise['muscleGroup'] {
  const key = raw
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  return MUSCLE_GROUP_MAP[key] ?? 'otro'
}

function findCatalogEntry(catalog: CatalogFile, key: string): CatalogEntry | undefined {
  return catalog.entries.find((e) => e.key === key)
}

function exerciseKeyFromRawId(rawId: string): string {
  // raw ids look like "g1-3-tricpes-extension-..." -> catalog key "g1-3"
  return rawId.split('-').slice(0, 2).join('-')
}

export function buildGymExercises(routine: RawRoutineFile, catalog: CatalogFile, nowIso: string): Exercise[] {
  const exercises: Exercise[] = []
  for (const day of routine.days) {
    for (const raw of day.exercises) {
      const catalogKey = exerciseKeyFromRawId(raw.id)
      const entry = findCatalogEntry(catalog, catalogKey)
      exercises.push({
        id: raw.id,
        name: raw.name,
        aliases: entry?.catalogName ? [entry.catalogName] : [],
        muscleGroup: mapMuscleGroup(raw.muscleGroupRaw),
        secondaryMuscles: [],
        category: 'gimnasio',
        trackingMode: 'reps',
        equipment: entry?.equipment ? [entry.equipment] : [],
        instructions: entry?.instructions ?? [],
        commonMistakes: raw.tip ? [raw.tip] : [],
        alternatives: [],
        image: { gifUrl: entry?.gifUrl ?? null, customUrl: null, sourceSlug: entry?.catalogSlug ?? null },
        hidden: false,
        isCustom: false,
        source: 'excel',
        order: raw.order + day.dayNumber * 100,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
    }
  }
  return exercises
}

export function buildCalisthenicsExercises(seed: CalisthenicsSeedItem[], catalog: CatalogFile, nowIso: string): Exercise[] {
  return seed.map((item, index) => {
    const entry = findCatalogEntry(catalog, item.key)
    return {
      id: item.key,
      name: item.name,
      aliases: entry?.catalogName ? [entry.catalogName] : [],
      muscleGroup: mapMuscleGroup(item.muscleGroupRaw),
      secondaryMuscles: [],
      category: 'calistenia',
      trackingMode: item.trackingMode,
      equipment: [],
      instructions: entry?.instructions ?? [],
      commonMistakes: [],
      alternatives: item.key === 'calistenia-dominadas' ? ['Remo invertido'] : [],
      image: { gifUrl: entry?.gifUrl ?? null, customUrl: null, sourceSlug: entry?.catalogSlug ?? null },
      hidden: false,
      isCustom: false,
      source: 'excel',
      order: index,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
  })
}

function planIdForDay(dayNumber: number): WorkoutPlan['id'] {
  return `gimnasio-dia-${dayNumber}` as WorkoutPlan['id']
}

export function buildGymPlans(routine: RawRoutineFile, nowIso: string): WorkoutPlan[] {
  return routine.days.map((day) => {
    const exercises: PlanExercise[] = day.exercises.map((raw) => ({
      id: `pe-${raw.id}`,
      exerciseId: raw.id,
      order: raw.order,
      targetSets: raw.targetSets ?? 3,
      targetReps: raw.targetReps,
      targetWeightByWeek: raw.targetWeightByWeek,
      restSeconds: raw.restSeconds,
      notes: raw.benefit,
    }))
    return {
      id: planIdForDay(day.dayNumber),
      title: day.title,
      subtitle: day.subtitle,
      type: 'gimnasio',
      exercises,
      updatedAt: nowIso,
    }
  })
}

export function buildCalisthenicsPlan(seed: CalisthenicsSeedItem[], nowIso: string): WorkoutPlan {
  const exercises: PlanExercise[] = seed.map((item, index) => ({
    id: `pe-${item.key}`,
    exerciseId: item.key,
    order: index,
    targetSets: item.targetSets,
    targetReps: item.targetReps,
    targetWeightByWeek: [null, null, null, null],
    restSeconds: item.restSeconds,
    notes: null,
  }))
  return {
    id: 'calistenia',
    title: 'Calistenia',
    subtitle: 'Completa tus ejercicios del día',
    type: 'calistenia',
    exercises,
    updatedAt: nowIso,
  }
}
