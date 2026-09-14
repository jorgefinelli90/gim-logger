'use client'

import { usePathname } from 'next/navigation'
import { Pause, Play, TimerReset } from 'lucide-react'
import { useTimerContext } from '@/lib/timer/TimerContext'

export function RestTimerFab() {
  const timer = useTimerContext()
  const pathname = usePathname()

  // The dashboard/rutina pages already show the full timer card — avoid a redundant floating duplicate there.
  const hideOnThisRoute = pathname === '/' || pathname.startsWith('/rutinas') || pathname === '/calistenia'
  const isActive = timer.running || (timer.remainingSeconds > 0 && timer.remainingSeconds < timer.totalSeconds)
  if (hideOnThisRoute || !isActive) return null

  const mm = String(Math.floor(timer.remainingSeconds / 60)).padStart(2, '0')
  const ss = String(timer.remainingSeconds % 60).padStart(2, '0')

  return (
    <div
      role="status"
      aria-label={`Temporizador de descanso: ${mm}:${ss} restantes`}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--ink)',
        color: '#fff',
        borderRadius: 999,
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,.35)',
      }}
    >
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 15 }}>
        {mm}:{ss}
      </span>
      <button
        onClick={() => (timer.running ? timer.pause() : timer.resume())}
        aria-label={timer.running ? 'Pausar descanso' : 'Reanudar descanso'}
        style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: '50%', background: 'var(--lime)', color: 'var(--ink)', border: 0 }}
      >
        {timer.running ? <Pause size={13} /> : <Play size={13} />}
      </button>
      <button onClick={timer.reset} aria-label="Reiniciar temporizador" style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: '50%', background: 'transparent', color: '#c7d0ca', border: '1px solid #3a453f' }}>
        <TimerReset size={13} />
      </button>
    </div>
  )
}
