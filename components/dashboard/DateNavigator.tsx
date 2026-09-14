'use client'

import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { addDays, formatLongDate, todayIso } from '@/lib/date/date-utils'

interface DateNavigatorProps {
  date: string
  onChange: (date: string) => void
}

export function DateNavigator({ date, onChange }: DateNavigatorProps) {
  const isToday = date === todayIso()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
      <button aria-label="Día anterior" onClick={() => onChange(addDays(date, -1))} className="icon-button">
        <ChevronLeft />
      </button>
      <span style={{ fontSize: 13, color: 'var(--muted)', minWidth: 170, textTransform: 'capitalize' }}>{formatLongDate(date)}</span>
      <button aria-label="Día siguiente" onClick={() => onChange(addDays(date, 1))} className="icon-button">
        <ChevronRight />
      </button>
      {!isToday && (
        <button
          onClick={() => onChange(todayIso())}
          style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, fontWeight: 700, border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', color: 'var(--foreground)', background: 'transparent' }}
        >
          <RotateCcw size={13} /> Hoy
        </button>
      )}
    </div>
  )
}
