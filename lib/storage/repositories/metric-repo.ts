import { deleteOne, getAll, putOne } from '../db'
import { createId, nowIso } from '../ids'
import type { BodyMetric, BodyMetricInput } from '@/types'

const STORE = 'bodyMetrics' as const

export async function listBodyMetrics(): Promise<BodyMetric[]> {
  const all = await getAll<BodyMetric>(STORE)
  return all.sort((a, b) => a.date.localeCompare(b.date))
}

export async function addBodyMetric(input: BodyMetricInput): Promise<BodyMetric> {
  const timestamp = nowIso()
  const metric: BodyMetric = { ...input, id: createId('metric'), createdAt: timestamp, updatedAt: timestamp }
  await putOne(STORE, metric)
  return metric
}

export async function deleteBodyMetric(id: string): Promise<void> {
  await deleteOne(STORE, id)
}
