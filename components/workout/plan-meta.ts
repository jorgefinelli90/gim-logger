import type { SessionType } from '@/types'

export interface PlanMeta {
  title: string
  subtitle: string
  badge: { label: string; tone: 'lime' | 'orange' }
}

export const PLAN_META: Partial<Record<SessionType, PlanMeta>> = {
  calistenia: { title: 'Calistenia', subtitle: 'Completa tus ejercicios del día', badge: { label: 'PESO CORPORAL', tone: 'lime' } },
  'gimnasio-dia-1': { title: 'Gimnasio · Día 1', subtitle: 'Pecho, tríceps y antebrazo', badge: { label: 'GIMNASIO', tone: 'orange' } },
  'gimnasio-dia-2': { title: 'Gimnasio · Día 2', subtitle: 'Espalda, bíceps y hombros', badge: { label: 'GIMNASIO', tone: 'orange' } },
  'gimnasio-dia-3': { title: 'Gimnasio · Día 3', subtitle: 'Piernas y abdomen', badge: { label: 'GIMNASIO', tone: 'orange' } },
  // Día 4 es exclusivo de la rutina de Sebastián (4 días); Jorge solo llega a Día 3.
  'gimnasio-dia-4': { title: 'Gimnasio · Día 4', subtitle: 'Brazos y hombros', badge: { label: 'GIMNASIO', tone: 'orange' } },
}

export const DEFAULT_PLAN_META: PlanMeta = { title: 'Descanso', subtitle: '', badge: { label: 'DESCANSO', tone: 'lime' } }
