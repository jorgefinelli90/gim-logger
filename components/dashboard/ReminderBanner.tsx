'use client'

import { BellRing } from 'lucide-react'
import { usePreferences } from '@/hooks/usePreferences'
import { todayIso } from '@/lib/date/date-utils'
import type { SessionType } from '@/types'

export function ReminderBanner({ date, type }: { date: string; type: SessionType }) {
  const { preferences, loaded } = usePreferences()

  if (!loaded || !preferences.reminderTime || type === 'descanso' || date !== todayIso()) return null

  const [h, m] = preferences.reminderTime.split(':').map(Number)
  const now = new Date()
  const reminderPassed = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)
  if (!reminderPassed) return null

  return (
    <div
      role="status"
      style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#eaf5b7', color: '#2c3a12', padding: '10px 14px', borderRadius: 10, marginTop: 16, fontSize: 13 }}
    >
      <BellRing size={16} aria-hidden />
      Es hora de entrenar — todavía no empezaste tu rutina de hoy.
    </div>
  )
}
