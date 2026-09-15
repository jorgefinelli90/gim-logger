import type { Exercise, PlanExercise, Profile, WorkoutPlan } from '@/types'
import type { CalisthenicsSeedItem } from '@/data/calisthenics-seed'
import { calisthenicsExerciseId, planStorageId } from '@/lib/storage/plan-id'
import type { CatalogEntry, CatalogFile, RawRoutineFile } from './types'

const MUSCLE_GROUP_MAP: Record<string, Exercise['muscleGroup']> = {
  PECHO: 'pecho',
  ESPALDA: 'espalda',
  HOMBROS: 'hombros',
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  TRICPES: 'triceps', // typo present in the source spreadsheet
  BICPES: 'biceps', // typo present in Sebastián's spreadsheet
  ANTEBRAZOS: 'antebrazos',
  PIERNAS: 'piernas',
  GLUTEOS: 'gluteos',
  ABDOMINALES: 'abdominales',
  PANTORRILLAS: 'pantorrillas',
  TRAPECIO: 'espalda',
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

/**
 * Catálogo de imágenes: cada entrada se busca por el id COMPLETO del
 * ejercicio, no por un prefijo truncado (`g1-0`). Antes del multiusuario un
 * prefijo de 2 tramos alcanzaba porque solo existía la rutina de Jorge; con
 * dos rutinas independientes generando ids con el mismo esquema (`g1-0-...`
 * para el día 1, ejercicio 0, de CUALQUIER perfil) ese prefijo truncado
 * dejaría de identificar un ejercicio único. El id completo ya es único por
 * construcción (ver `idPrefix` en `parseRoutineFile`), así que no hace falta
 * derivar nada.
 */
function findCatalogEntry(catalog: CatalogFile, exerciseId: string): CatalogEntry | undefined {
  return catalog.entries.find((e) => e.key === exerciseId)
}

export function buildGymExercises(routine: RawRoutineFile, catalog: CatalogFile, nowIso: string, profile: Profile): Exercise[] {
  const exercises: Exercise[] = []
  for (const day of routine.days) {
    for (const raw of day.exercises) {
      const entry = findCatalogEntry(catalog, raw.id)
      exercises.push({
        id: raw.id,
        profile,
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

export function buildCalisthenicsExercises(seed: CalisthenicsSeedItem[], catalog: CatalogFile, nowIso: string, profile: Profile): Exercise[] {
  return seed.map((item, index) => {
    // El catálogo de GIFs se busca por la clave SIN prefijo: el movimiento
    // (flexiones, dominadas...) es el mismo sea de quien sea la rutina.
    const entry = findCatalogEntry(catalog, item.key)
    return {
      id: calisthenicsExerciseId(profile, item.key),
      profile,
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

function planIdForDay(dayNumber: number): WorkoutPlan['dayId'] {
  return `gimnasio-dia-${dayNumber}` as WorkoutPlan['dayId']
}

export function buildGymPlans(routine: RawRoutineFile, nowIso: string, profile: Profile): WorkoutPlan[] {
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
    const dayId = planIdForDay(day.dayNumber)
    return {
      id: planStorageId(profile, dayId),
      dayId,
      profile,
      title: day.title,
      subtitle: day.subtitle,
      type: 'gimnasio',
      exercises,
      updatedAt: nowIso,
    }
  })
}

export function buildCalisthenicsPlan(seed: CalisthenicsSeedItem[], nowIso: string, profile: Profile): WorkoutPlan {
  const exercises: PlanExercise[] = seed.map((item, index) => ({
    id: `pe-${calisthenicsExerciseId(profile, item.key)}`,
    exerciseId: calisthenicsExerciseId(profile, item.key),
    order: index,
    targetSets: item.targetSets,
    targetReps: item.targetReps,
    targetWeightByWeek: [null, null, null, null],
    restSeconds: item.restSeconds,
    notes: null,
  }))
  return {
    id: planStorageId(profile, 'calistenia'),
    dayId: 'calistenia',
    profile,
    title: 'Calistenia',
    subtitle: 'Completa tus ejercicios del día',
    type: 'calistenia',
    exercises,
    updatedAt: nowIso,
  }
}
