import { getAll, getOne, putOne } from '../db'
import type { PlanDayId, WorkoutPlan } from '@/types'

const STORE = 'plans' as const

export async function listPlans(): Promise<WorkoutPlan[]> {
  return getAll<WorkoutPlan>(STORE)
}

export async function getPlan(id: PlanDayId): Promise<WorkoutPlan | undefined> {
  return getOne<WorkoutPlan>(STORE, id)
}

export async function savePlan(plan: WorkoutPlan): Promise<void> {
  await putOne(STORE, plan)
}

export async function seedPlansIfMissing(plans: WorkoutPlan[]): Promise<void> {
  const existing = await getAll<WorkoutPlan>(STORE)
  const existingIds = new Set(existing.map((p) => p.id))
  const missing = plans.filter((p) => !existingIds.has(p.id))
  await Promise.all(missing.map((plan) => putOne(STORE, plan)))
}
