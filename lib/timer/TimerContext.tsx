'use client'

import { createContext, useContext } from 'react'
import { useRestTimer, type RestTimerActions, type RestTimerState } from './useRestTimer'

const TimerContext = createContext<(RestTimerState & RestTimerActions) | null>(null)

export function TimerProvider({ children, soundEnabled, vibrationEnabled }: { children: React.ReactNode; soundEnabled: boolean; vibrationEnabled: boolean }) {
  const timer = useRestTimer(soundEnabled, vibrationEnabled)
  return <TimerContext.Provider value={timer}>{children}</TimerContext.Provider>
}

export function useTimerContext() {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimerContext debe usarse dentro de <TimerProvider>')
  return ctx
}
