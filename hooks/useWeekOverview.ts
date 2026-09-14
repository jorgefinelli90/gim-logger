'use client'

import { useEffect, useState } from 'react'
import type { SessionType } from '@/types'
import { listSessions } from '@/lib/storage/repositories/session-repo'
import { listAllSets } from '@/lib/storage/repositories/set-repo'
import { sessionTypeForDate } from '@/lib/date/date-utils'

export interface DayOverview {
  date: string
  type: SessionType
  completedSets: number
  totalSets: number
  percent: number
}

export function useWeekOverview(weekDates: string[], storageReady: boolean) {
  const [overview, setOverview] = useState<Record<string, DayOverview>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!storageReady) return
    let cancelled = false
    setLoading(true)
    Promise.all([listSessions(), listAllSets()]).then(([sessions, sets]) => {
      if (cancelled) return
      const result: Record<string, DayOverview> = {}
      for (const date of weekDates) {
        const type = sessionTypeForDate(date)
        const daySessions = sessions.filter((s) => s.date === date)
        const sessionIds = new Set(daySessions.map((s) => s.id))
        const daySets = sets.filter((s) => sessionIds.has(s.sessionId))
        const completedSets = daySets.filter((s) => s.completed).length
        const totalSets = daySets.length
        result[date] = { date, type, completedSets, totalSets, percent: totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100) }
      }
      setOverview(result)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady, weekDates.join(',')])

  return { overview, loading }
}
