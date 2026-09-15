import { getAll, getOne, putOne } from '../db'
import { planStorageId } from '../plan-id'
import type { PlanDayId, Profile, WorkoutPlan } from '@/types'

const STORE = 'plans' as const

export async function listPlans(profile: Profile): Promise<WorkoutPlan[]> {
  const all = await getAll<WorkoutPlan>(STORE)
  return all.filter((p) => p.profile === profile)
}

export async function getPlan(profile: Profile, dayId: PlanDayId): Promise<WorkoutPlan | undefined> {
  return getOne<WorkoutPlan>(STORE, planStorageId(profile, dayId))
}

export async function savePlan(plan: WorkoutPlan): Promise<void> {
  await putOne(STORE, plan)
}

export async function seedPlansIfMissing(plans: WorkoutPlan[]): Promise<void> {
  const existing = await getAll<WorkoutPlan>(STORE)
  const existingIds = new Set(existing.map((p) => p.id))
  const missing = plans.filter((p) => !existingIds.has(p.id))
  // Ver la nota en seedExercisesIfMissing: la semilla no se encola para subir.
  await Promise.all(missing.map((plan) => putOne(STORE, plan, false)))
}
