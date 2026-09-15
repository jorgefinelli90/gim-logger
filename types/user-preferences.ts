import type { WeightUnit } from './exercise-set'
import type { Profile } from './profile'

export type ThemePreference = 'light' | 'dark' | 'system'
export type WeekStartDay = 'monday' | 'sunday'

export interface UserPreferences {
  schemaVersion: number
  firstDayOfWeek: WeekStartDay
  timezone: string
  defaultRestSeconds: number
  units: WeightUnit
  theme: ThemePreference
  timerSoundEnabled: boolean
  timerVibrationEnabled: boolean
  reminderTime: string | null
  lastVisitedRoute: string | null
  /**
   * Qué perfil muestra ESTE dispositivo — como el tema, es local y nunca se
   * sincroniza (el celular de Sebas no tiene por qué mostrar el de Jorge solo
   * porque comparten cuenta). `null` antes de elegir la primera vez.
   */
  activeProfile: Profile | null
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  schemaVersion: 1,
  firstDayOfWeek: 'monday',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
  defaultRestSeconds: 90,
  units: 'kg',
  theme: 'system',
  timerSoundEnabled: true,
  timerVibrationEnabled: true,
  reminderTime: null,
  lastVisitedRoute: null,
  activeProfile: null,
}
