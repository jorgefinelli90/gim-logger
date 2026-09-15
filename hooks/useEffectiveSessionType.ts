'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Profile, SessionType } from '@/types'
import { getOrCreateSessionForDate, getSessionsForProfileAndDate, setPrimarySessionForDate } from '@/lib/storage/repositories/session-repo'
import { sessionTypeForDate } from '@/lib/date/date-utils'
import { useSyncRefresh } from '@/lib/sync/notify'

/**
 * Qué rutina se muestra HOY para (perfil, fecha): el horario semanal fijo,
 * salvo que ese día puntual se haya cambiado a otra cosa ("cambiar la rutina
 * de hoy" — swap día 2 por día 3, por ejemplo).
 *
 * El cambio se guarda marcando UNA sesión de ese día como `isPrimaryForDate`;
 * si ninguna lo está, se usa el default del horario. No hace falta borrar ni
 * reescribir nada para "deshacer" un cambio: alcanza con volver a elegir el
 * tipo que tocaba originalmente.
 */
export function useEffectiveSessionType(profile: Profile, date: string, storageReady: boolean) {
  const [type, setType] = useState<SessionType>(() => sessionTypeForDate(profile, date))
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!storageReady) return
    const sessions = await getSessionsForProfileAndDate(profile, date)
    const primary = sessions.find((s) => s.isPrimaryForDate && s.type !== 'descanso')
    setType(primary?.type ?? sessionTypeForDate(profile, date))
    setLoading(false)
  }, [profile, date, storageReady])

  useEffect(() => {
    load()
  }, [load])

  useSyncRefresh(load)

  const changeType = useCallback(
    async (newType: Exclude<SessionType, 'descanso'>) => {
      const session = await getOrCreateSessionForDate(date, {
        profile,
        date,
        type: newType,
        status: 'pendiente',
        isPrimaryForDate: true,
        startedAt: null,
        completedAt: null,
      })
      await setPrimarySessionForDate(profile, date, session.id)
      setType(newType)
    },
    [profile, date],
  )

  return { type, loading, changeType, isDefault: type === sessionTypeForDate(profile, date) }
}
