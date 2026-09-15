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
import { SyncProvider } from '@/components/sync/SyncProvider'
import { ProfileProvider } from '@/lib/profile/ProfileContext'
import { ProfileGate } from '@/components/profile/ProfileGate'
import { trainingDaysPerWeek } from '@/lib/date/profile-schedule'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { ready, error } = useStorageReady()
  const { preferences, setPreferences } = usePreferences()
  const profileChosen = preferences.activeProfile
  // No se puede saltear el hook por reglas de React: mientras no haya perfil
  // elegido, no hay nada real que calcular, así que se lo mantiene inactivo
  // pasando storageReady=false en vez de esperar un valor de perfil real.
  const { weeklyCount } = useStatistics(profileChosen ?? 'jorge', ready && profileChosen != null)
  const weeklyGoal = trainingDaysPerWeek(profileChosen ?? 'jorge')
  const weeklyPercent = Math.min(100, Math.round((weeklyCount / weeklyGoal) * 100))

  return (
    <ThemeProvider theme={preferences.theme}>
      <TimerProvider soundEnabled={preferences.timerSoundEnabled} vibrationEnabled={preferences.timerVibrationEnabled}>
        <SyncProvider>
          {!ready && !error ? (
            <div className="app-shell">
              <section className="content">
                <ShellSkeleton />
              </section>
            </div>
          ) : profileChosen == null && !error ? (
            <div className="app-shell">
              <section className="content">
                <ProfileGate onChoose={(profile) => setPreferences({ activeProfile: profile })} />
              </section>
            </div>
          ) : (
            <ProfileProvider profile={profileChosen ?? 'jorge'} setProfile={(profile) => setPreferences({ activeProfile: profile })}>
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
                  {children}
                </section>
                <BottomNav />
                <RestTimerFab />
              </div>
            </ProfileProvider>
          )}
        </SyncProvider>
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
