import { BarChart3, Calendar, Dumbbell, History, ListChecks, PersonStanding, Settings2, Target } from 'lucide-react'
import type { Profile } from '@/types'

export interface NavItem {
  href: string
  label: string
  icon: typeof Target
}

const CALISTENIA_ITEM: NavItem = { href: '/calistenia', label: 'Calistenia', icon: PersonStanding }

/** Calistenia está disponible para los dos perfiles — para Jorge es un día
 *  fijo del horario semanal, para Sebastián es una opción para sus días
 *  libres (ver `lib/date/profile-schedule.ts`). */
export function primaryNavForProfile(_profile: Profile): NavItem[] {
  return [
    { href: '/', label: 'Hoy', icon: Target },
    { href: '/calendario', label: 'Calendario', icon: Calendar },
    { href: '/rutinas', label: 'Rutinas', icon: Dumbbell },
    CALISTENIA_ITEM,
  ]
}

export const SECONDARY_NAV: NavItem[] = [
  { href: '/ejercicios', label: 'Ejercicios', icon: ListChecks },
  { href: '/historial', label: 'Historial', icon: History },
  { href: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
]

export const SETTINGS_NAV: NavItem = { href: '/configuracion', label: 'Configuración', icon: Settings2 }
