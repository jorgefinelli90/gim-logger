import type { SyncableStore } from '@/lib/storage/db'
import { planStorageId } from '@/lib/storage/plan-id'
import type { BodyMetric, DailyNote, Exercise, ExerciseSet, PersonalRecord, PlanDayId, Profile, WorkoutPlan, WorkoutSession } from '@/types'

/**
 * Traducción entre los registros locales (camelCase, IndexedDB) y las filas de
 * Postgres (snake_case). Es mecánico a propósito: un solo lugar donde mirar
 * cuando se agrega un campo, en vez de repartir el mapeo por los repositorios.
 */

/** Postgres devuelve `2026-09-15T10:00:00+00:00`; el resto de la app compara
 *  fechas con localeCompare sobre `...Z`. Normalizar acá evita que un registro
 *  bajado del servidor se ordene distinto que uno creado en el dispositivo. */
function toIso(value: string | null | undefined): string | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function isoOrNow(value: string | null | undefined): string {
  return toIso(value) ?? new Date().toISOString()
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function arr(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

/** Defensivo: toda fila nueva siempre trae `profile`, pero una fila vieja
 *  (subida antes de que este campo existiera) no debería romper el pull. */
function profileOf(value: unknown): Profile {
  return value === 'sebas' ? 'sebas' : 'jorge'
}

export interface TableSpec {
  /** Nombre de la tabla en Postgres. */
  table: string
  /** Campo del registro local que hace de clave primaria. */
  key: string
  /** Marca de tiempo local usada para resolver conflictos (last write wins). */
  stamp: (record: Record<string, unknown>) => string
  toRow: (record: never) => Record<string, unknown>
  /** Devuelve el registro local ya tipado; el motor lo guarda tal cual en
   *  IndexedDB, que no impone forma. */
  fromRow: (row: Record<string, unknown>) => unknown
}

const byUpdatedAt = (record: Record<string, unknown>): string =>
  typeof record.updatedAt === 'string' ? record.updatedAt : typeof record.createdAt === 'string' ? record.createdAt : ''

/** `Record<SyncableStore, …>` a propósito: si mañana se agrega un store
 *  sincronizable y nadie escribe su mapeo, esto no compila. */
export const TABLE_SPECS: Record<SyncableStore, TableSpec> = {
  exercises: {
    table: 'exercises',
    key: 'id',
    stamp: byUpdatedAt,
    toRow: (e: Exercise) => ({
      id: e.id,
      profile: e.profile,
      name: e.name,
      aliases: e.aliases,
      muscle_group: e.muscleGroup,
      secondary_muscles: e.secondaryMuscles,
      category: e.category,
      tracking_mode: e.trackingMode,
      equipment: e.equipment,
      instructions: e.instructions,
      common_mistakes: e.commonMistakes,
      alternatives: e.alternatives,
      image: e.image,
      hidden: e.hidden,
      is_custom: e.isCustom,
      source: e.source,
      order: e.order,
      created_at: e.createdAt,
      updated_at: e.updatedAt,
    }),
    fromRow: (r): Exercise => ({
      id: String(r.id),
      profile: profileOf(r.profile),
      name: String(r.name ?? ''),
      aliases: arr(r.aliases),
      muscleGroup: (r.muscle_group ?? 'otro') as Exercise['muscleGroup'],
      secondaryMuscles: arr(r.secondary_muscles) as Exercise['secondaryMuscles'],
      category: (r.category ?? 'gimnasio') as Exercise['category'],
      trackingMode: (r.tracking_mode ?? 'reps') as Exercise['trackingMode'],
      equipment: arr(r.equipment),
      instructions: arr(r.instructions),
      commonMistakes: arr(r.common_mistakes),
      alternatives: arr(r.alternatives),
      image: {
        gifUrl: str((r.image as Record<string, unknown>)?.gifUrl),
        customUrl: str((r.image as Record<string, unknown>)?.customUrl),
        sourceSlug: str((r.image as Record<string, unknown>)?.sourceSlug),
      },
      hidden: Boolean(r.hidden),
      isCustom: Boolean(r.is_custom),
      source: (r.source ?? 'custom') as Exercise['source'],
      order: num(r.order) ?? 0,
      createdAt: isoOrNow(str(r.created_at)),
      updatedAt: isoOrNow(str(r.updated_at)),
    }),
  },

  plans: {
    table: 'plans',
    key: 'id',
    stamp: byUpdatedAt,
    toRow: (p: WorkoutPlan) => ({
      id: p.id,
      profile: p.profile,
      day_id: p.dayId,
      title: p.title,
      subtitle: p.subtitle,
      type: p.type,
      exercises: p.exercises,
      updated_at: p.updatedAt,
    }),
    fromRow: (r): WorkoutPlan => {
      const profile = profileOf(r.profile)
      const dayId = (r.day_id as PlanDayId) ?? (r.id as PlanDayId)
      return {
        id: String(r.id ?? planStorageId(profile, dayId)),
        profile,
        dayId,
        title: String(r.title ?? ''),
        subtitle: String(r.subtitle ?? ''),
        type: (r.type ?? 'gimnasio') as WorkoutPlan['type'],
        exercises: Array.isArray(r.exercises) ? (r.exercises as WorkoutPlan['exercises']) : [],
        updatedAt: isoOrNow(str(r.updated_at)),
      }
    },
  },

  sessions: {
    table: 'sessions',
    key: 'id',
    stamp: byUpdatedAt,
    toRow: (s: WorkoutSession) => ({
      id: s.id,
      profile: s.profile,
      date: s.date,
      type: s.type,
      status: s.status,
      is_primary_for_date: s.isPrimaryForDate,
      started_at: s.startedAt,
      completed_at: s.completedAt,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    }),
    fromRow: (r): WorkoutSession => ({
      id: String(r.id),
      profile: profileOf(r.profile),
      date: String(r.date),
      type: (r.type ?? 'descanso') as WorkoutSession['type'],
      status: (r.status ?? 'pendiente') as WorkoutSession['status'],
      isPrimaryForDate: Boolean(r.is_primary_for_date),
      startedAt: toIso(str(r.started_at)),
      completedAt: toIso(str(r.completed_at)),
      createdAt: isoOrNow(str(r.created_at)),
      updatedAt: isoOrNow(str(r.updated_at)),
    }),
  },

  sets: {
    table: 'sets',
    key: 'id',
    stamp: byUpdatedAt,
    toRow: (s: ExerciseSet) => ({
      id: s.id,
      profile: s.profile,
      session_id: s.sessionId,
      exercise_id: s.exerciseId,
      set_index: s.setIndex,
      target_reps: s.targetReps,
      actual_reps: s.actualReps,
      weight: s.weight,
      unit: s.unit,
      rpe: s.rpe,
      duration_seconds: s.durationSeconds,
      distance_meters: s.distanceMeters,
      note: s.note,
      completed: s.completed,
      completed_at: s.completedAt,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    }),
    fromRow: (r): ExerciseSet => ({
      id: String(r.id),
      profile: profileOf(r.profile),
      sessionId: String(r.session_id),
      exerciseId: String(r.exercise_id),
      setIndex: num(r.set_index) ?? 0,
      targetReps: str(r.target_reps),
      actualReps: num(r.actual_reps),
      weight: num(r.weight),
      unit: (r.unit ?? 'kg') as ExerciseSet['unit'],
      rpe: num(r.rpe),
      durationSeconds: num(r.duration_seconds),
      distanceMeters: num(r.distance_meters),
      note: str(r.note),
      completed: Boolean(r.completed),
      completedAt: toIso(str(r.completed_at)),
      createdAt: isoOrNow(str(r.created_at)),
      updatedAt: isoOrNow(str(r.updated_at)),
    }),
  },

  notes: {
    table: 'notes',
    key: 'id',
    stamp: byUpdatedAt,
    toRow: (n: DailyNote) => ({
      id: n.id,
      profile: n.profile,
      date: n.date,
      general: n.general,
      energy_level: n.energyLevel,
      mood: n.mood,
      soreness: n.soreness,
      created_at: n.createdAt,
      updated_at: n.updatedAt,
    }),
    fromRow: (r): DailyNote => ({
      id: String(r.id),
      profile: profileOf(r.profile),
      date: String(r.date),
      general: String(r.general ?? ''),
      energyLevel: num(r.energy_level),
      mood: num(r.mood),
      soreness: str(r.soreness),
      createdAt: isoOrNow(str(r.created_at)),
      updatedAt: isoOrNow(str(r.updated_at)),
    }),
  },

  bodyMetrics: {
    table: 'body_metrics',
    key: 'id',
    stamp: byUpdatedAt,
    toRow: (m: BodyMetric) => ({
      id: m.id,
      profile: m.profile,
      date: m.date,
      weight: m.weight,
      note: m.note,
      created_at: m.createdAt,
      updated_at: m.updatedAt,
    }),
    fromRow: (r): BodyMetric => ({
      id: String(r.id),
      profile: profileOf(r.profile),
      date: String(r.date),
      weight: num(r.weight),
      note: str(r.note),
      createdAt: isoOrNow(str(r.created_at)),
      updatedAt: isoOrNow(str(r.updated_at)),
    }),
  },

  records: {
    table: 'records',
    key: 'id',
    // PersonalRecord no tiene updatedAt: es inmutable una vez conseguido.
    stamp: (r) => (typeof r.createdAt === 'string' ? r.createdAt : ''),
    toRow: (p: PersonalRecord) => ({
      id: p.id,
      profile: p.profile,
      exercise_id: p.exerciseId,
      type: p.type,
      value: p.value,
      unit: p.unit,
      date: p.date,
      session_id: p.sessionId,
      set_id: p.setId,
      created_at: p.createdAt,
      updated_at: p.createdAt,
    }),
    fromRow: (r): PersonalRecord => ({
      id: String(r.id),
      profile: profileOf(r.profile),
      exerciseId: String(r.exercise_id),
      type: (r.type ?? 'max-weight') as PersonalRecord['type'],
      value: num(r.value) ?? 0,
      unit: str(r.unit) as PersonalRecord['unit'],
      date: String(r.date),
      sessionId: String(r.session_id),
      setId: String(r.set_id),
      createdAt: isoOrNow(str(r.created_at)),
    }),
  },
}

