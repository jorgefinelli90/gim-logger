import { describe, expect, it } from 'vitest'
import { TABLE_SPECS } from './tables'
import type { BodyMetric, DailyNote, Exercise, ExerciseSet, PersonalRecord, WorkoutPlan, WorkoutSession } from '@/types'

/** `toRow` declara el parámetro como `never` para que el mapa de specs acepte
 *  cada tipo concreto; en los tests lo llamamos con el tipo real. */
function toRow<T>(spec: { toRow: (record: never) => Record<string, unknown> }, record: T): Record<string, unknown> {
  return (spec.toRow as unknown as (r: T) => Record<string, unknown>)(record)
}

const exercise: Exercise = {
  id: 'g1-0-pecho-press-superior-con-barra-en-maquina',
  profile: 'jorge',
  name: 'Press superior con barra en máquina',
  aliases: ['Smith Machine Incline Bench Press'],
  muscleGroup: 'pecho',
  secondaryMuscles: ['triceps'],
  category: 'gimnasio',
  trackingMode: 'reps',
  equipment: ['smith machine'],
  instructions: ['Sentate con la espalda apoyada.'],
  commonMistakes: ['No rebotar la barra en el pecho.'],
  alternatives: [],
  image: { gifUrl: 'https://cdn.jsdelivr.net/gh/x/y@v1.1.0/a.gif', customUrl: null, sourceSlug: 'incline-press' },
  hidden: false,
  isCustom: false,
  source: 'excel',
  order: 100,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-02T11:30:00.000Z',
}

const set: ExerciseSet = {
  id: 'set-abc',
  profile: 'jorge',
  sessionId: 'session-1',
  exerciseId: exercise.id,
  setIndex: 2,
  targetReps: '8-10',
  actualReps: 9,
  weight: 42.5,
  unit: 'kg',
  rpe: 8,
  durationSeconds: null,
  distanceMeters: null,
  note: 'Subí 2.5 kg',
  completed: true,
  completedAt: '2026-09-02T11:29:00.000Z',
  createdAt: '2026-09-02T11:00:00.000Z',
  updatedAt: '2026-09-02T11:29:00.000Z',
}

const session: WorkoutSession = {
  id: 'session-1',
  profile: 'jorge',
  date: '2026-09-02',
  type: 'gimnasio-dia-1',
  status: 'completo',
  isPrimaryForDate: true,
  startedAt: '2026-09-02T11:00:00.000Z',
  completedAt: '2026-09-02T12:05:00.000Z',
  createdAt: '2026-09-02T11:00:00.000Z',
  updatedAt: '2026-09-02T12:05:00.000Z',
}

const plan: WorkoutPlan = {
  id: 'calistenia',
  dayId: 'calistenia',
  profile: 'jorge',
  title: 'Calistenia',
  subtitle: 'Lunes, miércoles y viernes',
  type: 'calistenia',
  exercises: [
    {
      id: 'pe-calistenia-flexiones',
      exerciseId: 'calistenia-flexiones',
      order: 0,
      targetSets: 3,
      targetReps: '12',
      targetWeightByWeek: [null, null, null, null],
      restSeconds: 90,
      notes: null,
    },
  ],
  updatedAt: '2026-09-02T09:00:00.000Z',
}

const note: DailyNote = {
  id: 'note-1',
  profile: 'jorge',
  date: '2026-09-02',
  general: 'Buen día, mucha energía.',
  energyLevel: 4,
  mood: 5,
  soreness: null,
  createdAt: '2026-09-02T20:00:00.000Z',
  updatedAt: '2026-09-02T20:10:00.000Z',
}

const metric: BodyMetric = {
  id: 'metric-1',
  profile: 'jorge',
  date: '2026-09-02',
  weight: 78.4,
  note: null,
  createdAt: '2026-09-02T07:00:00.000Z',
  updatedAt: '2026-09-02T07:00:00.000Z',
}

const record: PersonalRecord = {
  id: 'pr-1',
  profile: 'jorge',
  exerciseId: exercise.id,
  type: 'max-weight',
  value: 42.5,
  unit: 'kg',
  date: '2026-09-02',
  sessionId: 'session-1',
  setId: 'set-abc',
  createdAt: '2026-09-02T11:29:00.000Z',
}

describe('mapeo local <-> Postgres', () => {
  it.each([
    ['exercises', exercise],
    ['sessions', session],
    ['sets', set],
    ['plans', plan],
    ['notes', note],
    ['bodyMetrics', metric],
    ['records', record],
  ] as const)('%s sobrevive la ida y vuelta sin perder datos', (store, original) => {
    const spec = TABLE_SPECS[store]
    expect(spec.fromRow(toRow(spec, original))).toEqual(original)
  })

  it('normaliza los timestamps que devuelve Postgres al formato de la app', () => {
    // Postgres responde `+00:00`; el resto de la app ordena con localeCompare
    // sobre cadenas `...Z`. Mezclar los dos formatos desordena el historial.
    const row = { ...toRow(TABLE_SPECS.sets, set), created_at: '2026-09-02 11:00:00+00', updated_at: '2026-09-02 11:29:00+00' }
    const result = TABLE_SPECS.sets.fromRow(row) as ExerciseSet
    expect(result.createdAt).toBe('2026-09-02T11:00:00.000Z')
    expect(result.updatedAt).toBe('2026-09-02T11:29:00.000Z')
  })

  it('mantiene en null los números vacíos en vez de convertirlos en cero', () => {
    // Un peso sin registrar no es "levantó 0 kg": la diferencia cambia las
    // estadísticas y los récords.
    const row = { ...toRow(TABLE_SPECS.sets, set), weight: null, actual_reps: null, rpe: null }
    const result = TABLE_SPECS.sets.fromRow(row) as ExerciseSet
    expect(result.weight).toBeNull()
    expect(result.actualReps).toBeNull()
    expect(result.rpe).toBeNull()
  })

  it('tolera una fila incompleta sin romper', () => {
    const result = TABLE_SPECS.exercises.fromRow({ id: 'x', name: 'Sentadilla' }) as Exercise
    expect(result.aliases).toEqual([])
    expect(result.image).toEqual({ gifUrl: null, customUrl: null, sourceSlug: null })
    expect(result.muscleGroup).toBe('otro')
    // Una fila sin `profile` (no debería pasar nunca, pero por las dudas) no
    // debe reventar el pull: se asume Jorge en vez de tirar.
    expect(result.profile).toBe('jorge')
  })

  it('preserva el perfil de Sebastián en la ida y vuelta', () => {
    const sebasExercise: Exercise = { ...exercise, id: 'sebas-g1-0-pecho-press-superior-con-barra-en-maquina-smith', profile: 'sebas' }
    const row = toRow(TABLE_SPECS.exercises, sebasExercise)
    expect(row.profile).toBe('sebas')
    expect((TABLE_SPECS.exercises.fromRow(row) as Exercise).profile).toBe('sebas')
  })

  it('separa la identidad lógica del día (dayId) de la clave de almacenamiento (id) al mapear un plan', () => {
    const sebasPlan: WorkoutPlan = { ...plan, id: 'sebas-gimnasio-dia-1', dayId: 'gimnasio-dia-1', profile: 'sebas', type: 'gimnasio' }
    const row = toRow(TABLE_SPECS.plans, sebasPlan)
    expect(row.id).toBe('sebas-gimnasio-dia-1')
    expect(row.day_id).toBe('gimnasio-dia-1')
    const result = TABLE_SPECS.plans.fromRow(row) as WorkoutPlan
    expect(result.dayId).toBe('gimnasio-dia-1')
    expect(result.id).toBe('sebas-gimnasio-dia-1')
  })

  it('usa updatedAt para decidir quién gana un conflicto', () => {
    expect(TABLE_SPECS.sets.stamp({ ...set })).toBe(set.updatedAt)
    // PersonalRecord no tiene updatedAt: es inmutable, se compara por creación.
    expect(TABLE_SPECS.records.stamp({ ...record })).toBe(record.createdAt)
  })

  it('cada tabla sincronizable tiene nombre y clave declarados', () => {
    for (const [store, spec] of Object.entries(TABLE_SPECS)) {
      expect(spec.table, store).toMatch(/^[a-z_]+$/)
      expect(spec.key, store).toBe('id')
    }
  })
})
