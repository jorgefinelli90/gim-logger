'use client'

import { useEffect, useRef, useState } from 'react'
import { Menu, Search, TriangleAlert } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useStorageReady } from '@/hooks/useStorageReady'
import { usePreferences } from '@/hooks/usePreferences'
import { useStatistics } from '@/hooks/useStatistics'
import { ThemeProvider } from '@/lib/theme/ThemeProvider'
import { TimerProvider } from '@/lib/timer/TimerContext'
import { RestTimerFab } from '@/components/timer/RestTimerFab'
import { SyncProvider, useSync } from '@/components/sync/SyncProvider'
import { ProfileProvider } from '@/lib/profile/ProfileContext'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { accountForEmail } from '@/lib/auth/accounts'
import { trainingDaysPerWeek } from '@/lib/date/profile-schedule'
import type { Profile, UserPreferences } from '@/types'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { preferences, setPreferences } = usePreferences()

  return (
    <ThemeProvider theme={preferences.theme}>
      <TimerProvider soundEnabled={preferences.timerSoundEnabled} vibrationEnabled={preferences.timerVibrationEnabled}>
        {/* SyncProvider va por fuera del cuerpo porque el cuerpo necesita
            leer el estado de sesión para decidir si muestra el login. */}
        <SyncProvider>
          <AppShellBody preferences={preferences} setPreferences={setPreferences}>
            {children}
          </AppShellBody>
        </SyncProvider>
      </TimerProvider>
    </ThemeProvider>
  )
}

function AppShellBody({
  preferences,
  setPreferences,
  children,
}: {
  preferences: UserPreferences
  setPreferences: (patch: Partial<UserPreferences>) => void
  children: React.ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { ready, error } = useStorageReady()
  const { status, email, signIn } = useSync()

  // Quién entró define qué rutina se abre. Después se puede cambiar de perfil
  // desde la barra lateral (se ven todo entre ellos) — por eso solo se aplica
  // cuando CAMBIA la cuenta, no en cada render: si no, pisaría ese cambio
  // manual todo el tiempo.
  const appliedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!email || appliedFor.current === email) return
    appliedFor.current = email
    const account = accountForEmail(email)
    if (account) setPreferences({ activeProfile: account.profile })
  }, [email, setPreferences])

  const signedIn = status !== 'signed-out' && status !== 'off' && status !== 'restoring'
  const profile: Profile = preferences.activeProfile ?? accountForEmail(email)?.profile ?? 'jorge'

  const { weeklyCount } = useStatistics(profile, ready && signedIn)
  const weeklyPercent = Math.min(100, Math.round((weeklyCount / trainingDaysPerWeek(profile)) * 100))

  // `restoring` cuenta como "cargando", no como "deslogueado": si no, al
  // recargar parpadearía el login un instante antes de restaurar la sesión.
  if ((!ready || status === 'restoring') && !error) {
    return (
      <div className="app-shell">
        <section className="content">
          <ShellSkeleton />
        </section>
      </div>
    )
  }

  if (!signedIn) {
    return (
      <div className="app-shell">
        <section className="content">
          <LoginScreen onSubmit={signIn} configured={status !== 'off'} />
        </section>
      </div>
    )
  }

  return (
    <ProfileProvider profile={profile} setProfile={(next) => setPreferences({ activeProfile: next })}>
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
