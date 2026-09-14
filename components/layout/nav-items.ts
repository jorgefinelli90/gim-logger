import { BarChart3, Calendar, Dumbbell, History, ListChecks, PersonStanding, Settings2, Target } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: typeof Target
}

export const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: 'Hoy', icon: Target },
  { href: '/calendario', label: 'Calendario', icon: Calendar },
  { href: '/rutinas', label: 'Rutinas', icon: Dumbbell },
  { href: '/calistenia', label: 'Calistenia', icon: PersonStanding },
]

export const SECONDARY_NAV: NavItem[] = [
  { href: '/ejercicios', label: 'Ejercicios', icon: ListChecks },
  { href: '/historial', label: 'Historial', icon: History },
  { href: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
]

export const SETTINGS_NAV: NavItem = { href: '/configuracion', label: 'Configuración', icon: Settings2 }
