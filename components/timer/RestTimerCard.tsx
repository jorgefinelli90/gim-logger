'use client'

import { Clock3, Pause, Play, TimerReset } from 'lucide-react'
import { useTimerContext } from '@/lib/timer/TimerContext'
import { usePreferences } from '@/hooks/usePreferences'

const QUICK_VALUES = [30, 60, 90, 120, 180]

function formatTime(totalSeconds: number): { mm: string; ss: string } {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const ss = String(totalSeconds % 60).padStart(2, '0')
  return { mm, ss }
}

export function RestTimerCard() {
  const timer = useTimerContext()
  const { preferences } = usePreferences()
  const { mm, ss } = formatTime(timer.remainingSeconds)

  return (
    <section className="timer-card" aria-label="Temporizador de descanso">
      <div className="card-title">
        <span>
          <Clock3 aria-hidden /> DESCANSO
        </span>
        <button onClick={timer.reset} aria-label="Reiniciar temporizador">
          <TimerReset aria-hidden />
        </button>
      </div>
      {/* No aria-live on the ticking digits — it would announce every second.
          The status line below announces the state changes instead. */}
      <div className="timer-display">
        {mm}
        <small>:</small>
        {ss}
      </div>
      {timer.label && <p style={{ marginTop: -10 }}>{timer.label}</p>}
      <p aria-live="polite">{timer.running ? 'El descanso está corriendo' : timer.remainingSeconds === 0 ? '¡Descanso terminado!' : 'Listo para tu próxima serie'}</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {QUICK_VALUES.map((seconds) => (
          <button
            key={seconds}
            onClick={() => timer.start(seconds)}
            style={{
              flex: '1 1 auto',
              padding: '8px 6px',
              fontSize: 11,
              borderRadius: 8,
              border: '1px solid #34403a',
              background: 'transparent',
              color: '#c7d0ca',
            }}
          >
            {seconds}s
          </button>
        ))}
      </div>

      <button
        className={`timer-button ${timer.running ? 'running' : ''}`}
        onClick={() => (timer.running ? timer.pause() : timer.remainingSeconds > 0 ? timer.resume() : timer.start(preferences.defaultRestSeconds))}
      >
        {timer.running ? <Pause aria-hidden /> : <Play aria-hidden />} {timer.running ? 'Pausar descanso' : timer.active ? 'Reanudar' : 'Iniciar descanso'}
      </button>
    </section>
  )
}
