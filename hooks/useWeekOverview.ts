'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Profile, SessionType } from '@/types'
import { listSessions } from '@/lib/storage/repositories/session-repo'
import { listAllSets } from '@/lib/storage/repositories/set-repo'
import { sessionTypeForDate } from '@/lib/date/date-utils'
import { useSyncRefresh } from '@/lib/sync/notify'

export interface DayOverview {
  date: string
  type: SessionType
  completedSets: number
  totalSets: number
  percent: number
}

export function useWeekOverview(profile: Profile, weekDates: string[], storageReady: boolean) {
  const [overview, setOverview] = useState<Record<string, DayOverview>>({})
  const [loading, setLoading] = useState(true)
  // El lint de hooks solo acepta expresiones simples en un array de
  // dependencias — un array nuevo en cada render igual, así que se compara
  // por esta clave derivada en vez de por identidad.
  const weekKey = weekDates.join(',')

  const load = useCallback(async () => {
    if (!storageReady) return
    setLoading(true)
    const [allSessions, allSets] = await Promise.all([listSessions(), listAllSets()])
    const sessions = allSessions.filter((s) => s.profile === profile)
    const sets = allSets.filter((s) => s.profile === profile)
    const result: Record<string, DayOverview> = {}
    for (const date of weekDates) {
      const daySessions = sessions.filter((s) => s.date === date)
      // Si ese día se cambió de rutina, reflejar la sesión primaria en vez
      // del horario fijo — así el calendario muestra lo que de verdad se va
      // a entrenar, no lo que tocaría por defecto.
      const primary = daySessions.find((s) => s.isPrimaryForDate && s.type !== 'descanso')
      const type = primary?.type ?? sessionTypeForDate(profile, date)
      const sessionIds = new Set(daySessions.map((s) => s.id))
      const daySets = sets.filter((s) => sessionIds.has(s.sessionId))
      const completedSets = daySets.filter((s) => s.completed).length
      const totalSets = daySets.length
      result[date] = { date, type, completedSets, totalSets, percent: totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100) }
    }
    setOverview(result)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, storageReady, weekKey])

  useEffect(() => {
    load()
  }, [load])

  useSyncRefresh(load)

  return { overview, loading }
}
