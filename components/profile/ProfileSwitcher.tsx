'use client'

import { PROFILES, PROFILE_LABELS } from '@/types'
import { useActiveProfile } from '@/lib/profile/ProfileContext'

/** Par de pestañas Jorge/Sebastián en la barra lateral — cambia qué rutina se
 *  muestra en TODA la app (dashboard, rutinas, historial, estadísticas…). */
export function ProfileSwitcher() {
  const { profile, setProfile } = useActiveProfile()

  return (
    <div role="tablist" aria-label="Perfil activo" style={{ display: 'flex', gap: 4, padding: 3, background: '#232d28', borderRadius: 10, margin: '14px 16px 0' }}>
      {PROFILES.map((p) => (
        <button
          key={p}
          type="button"
          role="tab"
          aria-selected={p === profile}
          onClick={() => setProfile(p)}
          style={{
            flex: 1,
            padding: '7px 0',
            borderRadius: 8,
            border: 0,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            background: p === profile ? 'var(--lime)' : 'transparent',
            color: p === profile ? 'var(--ink)' : '#c7d0ca',
            transition: 'background .15s ease, color .15s ease',
          }}
        >
          {PROFILE_LABELS[p]}
        </button>
      ))}
    </div>
  )
}
