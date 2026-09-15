'use client'

import { Repeat } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { planDaysForProfile } from '@/lib/date/profile-schedule'
import { sessionTypeLabel } from '@/lib/date/date-utils'
import type { Profile, SessionType } from '@/types'

/**
 * "Cambiar la rutina de hoy" — no toca el horario semanal, solo qué rutina
 * se abre PARA ESTE día puntual (ej: hacer día 3 en vez del día 2 que
 * tocaba). Se puede volver al horario normal eligiéndolo de nuevo acá mismo.
 */
export function RoutineSwapControl({
  profile,
  type,
  isDefault,
  onChange,
}: {
  profile: Profile
  type: SessionType
  isDefault: boolean
  onChange: (type: Exclude<SessionType, 'descanso'>) => void
}) {
  const options = planDaysForProfile(profile) as Exclude<SessionType, 'descanso'>[]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
      <Repeat size={14} aria-hidden style={{ color: 'var(--muted)', flexShrink: 0 }} />
      <Select items={Object.fromEntries(options.map((o) => [o, sessionTypeLabel(o)]))} value={type === 'descanso' ? undefined : type} onValueChange={(v) => v && onChange(v as Exclude<SessionType, 'descanso'>)}>
        <SelectTrigger className="h-8 w-auto text-xs">
          <SelectValue placeholder="Cambiar rutina de hoy" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {sessionTypeLabel(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!isDefault && <span style={{ fontSize: 11, color: 'var(--muted)' }}>(cambiada)</span>}
    </div>
  )
}
