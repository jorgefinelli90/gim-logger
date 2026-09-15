import { describe, expect, it } from 'vitest'
import { buildCalisthenicsExercises, buildCalisthenicsPlan, buildGymExercises, buildGymPlans, mapMuscleGroup } from './transform'
import type { CatalogFile, RawRoutineFile } from './types'
import type { CalisthenicsSeedItem } from '@/data/calisthenics-seed'

describe('mapMuscleGroup', () => {
  it('fixes the "TRICPES" typo present in the source spreadsheet', () => {
    expect(mapMuscleGroup('TRICPES')).toBe('triceps')
  })

  it('is case and accent insensitive', () => {
    expect(mapMuscleGroup('bíceps')).toBe('biceps')
    expect(mapMuscleGroup('Piernas')).toBe('piernas')
  })

  it('falls back to "otro" for unknown groups instead of guessing', () => {
    expect(mapMuscleGroup('COSA-RARA')).toBe('otro')
  })
})

const ROUTINE_FIXTURE: RawRoutineFile = {
  schemaVersion: 1,
  generatedAt: '2026-01-01T00:00:00.000Z',
  sourceFile: 'fixture.xlsx',
  sourceSheet: 'Hoja1',
  days: [
    {
      dayNumber: 1,
      title: 'Gimnasio · Día 1',
      subtitle: 'Pecho',
      exercises: [
        {
          id: 'g1-0-pecho-press-plano',
          order: 0,
          muscleGroupRaw: 'PECHO',
          name: 'Press plano en máquina',
          targetSets: 3,
          targetReps: '8-12 reps',
          setsRepsRaw: '3 series (8-12 reps)',
          targetWeightByWeek: [null, null, null, null],
          restSeconds: 90,
          restRaw: '90 segundos',
          benefit: null,
          tip: null,
        },
      ],
    },
  ],
}

const CATALOG_FIXTURE: CatalogFile = {
  schemaVersion: 1,
  generatedAt: '2026-01-01T00:00:00.000Z',
  cdnBase: 'https://cdn.example',
  entries: [
    {
      key: 'g1-0-pecho-press-plano',
      name: 'Press plano en máquina',
      muscleGroupRaw: 'PECHO',
      matched: true,
      matchMethod: 'override',
      matchScore: 1,
      catalogSlug: 'lever-chest-press',
      catalogName: 'Press de pecho en máquina',
      muscle: 'pectorals',
      equipment: 'lever',
      bodyPart: 'chest',
      instructions: ['Paso 1'],
      gifUrl: 'https://cdn.example/pectorals/lever-chest-press.gif',
      thumbUrl: 'https://cdn.example/pectorals/lever-chest-press.thumb.webp',
    },
  ],
}

describe('buildGymExercises / buildGymPlans', () => {
  it('never invents values: an unmatched field stays null, not guessed', () => {
    const exercises = buildGymExercises(ROUTINE_FIXTURE, CATALOG_FIXTURE, '2026-01-01T00:00:00.000Z', 'jorge')
    expect(exercises).toHaveLength(1)
    expect(exercises[0].image.gifUrl).toBe('https://cdn.example/pectorals/lever-chest-press.gif')
    expect(exercises[0].muscleGroup).toBe('pecho')
    expect(exercises[0].profile).toBe('jorge')

    const plans = buildGymPlans(ROUTINE_FIXTURE, '2026-01-01T00:00:00.000Z', 'jorge')
    expect(plans[0].exercises[0].targetWeightByWeek).toEqual([null, null, null, null])
    expect(plans[0].exercises[0].restSeconds).toBe(90)
    expect(plans[0].id).toBe('gimnasio-dia-1')
    expect(plans[0].dayId).toBe('gimnasio-dia-1')
  })

  it('prefixes the plan storage id for any profile other than jorge, without changing the logical dayId', () => {
    const plans = buildGymPlans(ROUTINE_FIXTURE, '2026-01-01T00:00:00.000Z', 'sebas')
    expect(plans[0].id).toBe('sebas-gimnasio-dia-1')
    expect(plans[0].dayId).toBe('gimnasio-dia-1')
    expect(plans[0].profile).toBe('sebas')
  })
})

const CALISTHENICS_SEED_FIXTURE: CalisthenicsSeedItem[] = [
  { key: 'calistenia-flexiones', name: 'Flexiones', muscleGroupRaw: 'EMPUJE', targetSets: 4, targetReps: 'Al fallo técnico', trackingMode: 'reps', restSeconds: 90 },
]

describe('buildCalisthenicsExercises / buildCalisthenicsPlan', () => {
  it('maps movement-pattern labels (EMPUJE) to a real muscle group', () => {
    const exercises = buildCalisthenicsExercises(CALISTHENICS_SEED_FIXTURE, { ...CATALOG_FIXTURE, entries: [] }, '2026-01-01T00:00:00.000Z', 'jorge')
    expect(exercises[0].muscleGroup).toBe('pecho')
    expect(exercises[0].category).toBe('calistenia')
    expect(exercises[0].profile).toBe('jorge')
  })

  it('builds a plan whose plan-exercise order matches the seed order', () => {
    const plan = buildCalisthenicsPlan(CALISTHENICS_SEED_FIXTURE, '2026-01-01T00:00:00.000Z', 'jorge')
    expect(plan.id).toBe('calistenia')
    expect(plan.dayId).toBe('calistenia')
    expect(plan.exercises[0].exerciseId).toBe('calistenia-flexiones')
  })

  it("prefixes Sebastián's calisthenics exercise/plan ids so they never collide with Jorge's, while still finding the shared GIF", () => {
    const catalogWithPushUp: CatalogFile = {
      ...CATALOG_FIXTURE,
      entries: [{ ...CATALOG_FIXTURE.entries[0], key: 'calistenia-flexiones', catalogSlug: 'push-up' }],
    }
    const exercises = buildCalisthenicsExercises(CALISTHENICS_SEED_FIXTURE, catalogWithPushUp, '2026-01-01T00:00:00.000Z', 'sebas')
    expect(exercises[0].id).toBe('sebas-calistenia-flexiones')
    expect(exercises[0].profile).toBe('sebas')
    // El catálogo se busca por la clave SIN prefijo: el movimiento es el
    // mismo, así que no hace falta una entrada de catálogo duplicada por perfil.
    expect(exercises[0].image.sourceSlug).toBe('push-up')

    const plan = buildCalisthenicsPlan(CALISTHENICS_SEED_FIXTURE, '2026-01-01T00:00:00.000Z', 'sebas')
    expect(plan.id).toBe('sebas-calistenia')
    expect(plan.dayId).toBe('calistenia')
    expect(plan.exercises[0].exerciseId).toBe('sebas-calistenia-flexiones')
  })
})
