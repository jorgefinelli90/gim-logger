'use client'

import { useState } from 'react'
import { Menu, Search, TriangleAlert } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useStorageReady } from '@/hooks/useStorageReady'
import { usePreferences } from '@/hooks/usePreferences'
import { useStatistics } from '@/hooks/useStatistics'
import { ThemeProvider } from '@/lib/theme/ThemeProvider'
import { TimerProvider } from '@/lib/timer/TimerContext'
import { RestTimerFab } from '@/components/timer/RestTimerFab'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { ready, error } = useStorageReady()
  const { preferences } = usePreferences()
  const { weeklyCount } = useStatistics(ready)
  const weeklyPercent = Math.min(100, Math.round((weeklyCount / 6) * 100))

  return (
    <ThemeProvider theme={preferences.theme}>
      <TimerProvider soundEnabled={preferences.timerSoundEnabled} vibrationEnabled={preferences.timerVibrationEnabled}>
        <div className="app-shell">
          <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} weeklyPercent={weeklyPercent} />
          {menuOpen && <button className="mobile-backdrop" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" />}
          <section className="content">
            <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
              <Menu />
            </button>
            {error && (
              <div role="alert" style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#3a1f1f', color: '#ffd7d7', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
                <TriangleAlert size={18} aria-hidden />
                {error} Recargá la página para reintentar.
              </div>
            )}
            {!ready && !error ? <ShellSkeleton /> : children}
          </section>
          <BottomNav />
          <RestTimerFab />
        </div>
      </TimerProvider>
    </ThemeProvider>
  )
}

function ShellSkeleton() {
  return (
    <div role="status" aria-live="polite" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)' }}>
      <Search size={22} aria-hidden style={{ opacity: 0.5 }} />
      <p style={{ marginTop: 10, fontSize: 13 }}>Cargando tus datos locales…</p>
    </div>
  )
}
