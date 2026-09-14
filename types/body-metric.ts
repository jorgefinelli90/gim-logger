export interface BodyMetric {
  id: string
  /** ISO date (yyyy-mm-dd). */
  date: string
  weight: number | null
  note: string | null
  createdAt: string
  updatedAt: string
}

export type BodyMetricInput = Omit<BodyMetric, 'id' | 'createdAt' | 'updatedAt'>
