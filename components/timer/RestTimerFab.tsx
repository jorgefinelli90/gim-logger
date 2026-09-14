'use client'

import { Pause, Play, TimerReset } from 'lucide-react'
import { useTimerContext } from '@/lib/timer/TimerContext'

/**
 * Floating countdown shown on every route while a rest is running, so the
 * timer stays visible no matter how far down the exercise list you've
 * scrolled (the full timer card lives at the end of the page).
 */
export function RestTimerFab() {
  const timer = useTimerContext()
  if (!timer.active) return null

  const mm = String(Math.floor(timer.remainingSeconds / 60)).padStart(2, '0')
  const ss = String(timer.remainingSeconds % 60).padStart(2, '0')

  return (
    <div className="timer-fab" role="status" aria-label={`Descanso${timer.label ? ` de ${timer.label}` : ''}: ${mm}:${ss} restantes`}>
      <b>
        {mm}:{ss}
      </b>
      <button className="fab-main" onClick={() => (timer.running ? timer.pause() : timer.resume())} aria-label={timer.running ? 'Pausar descanso' : 'Reanudar descanso'}>
        {timer.running ? <Pause size={13} /> : <Play size={13} />}
      </button>
      <button className="fab-reset" onClick={timer.reset} aria-label="Reiniciar temporizador">
        <TimerReset size={13} />
      </button>
    </div>
  )
}
