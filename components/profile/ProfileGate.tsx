'use client'

import { Dumbbell } from 'lucide-react'
import { PROFILES, PROFILE_LABELS, type Profile } from '@/types'

/**
 * Pantalla de "¿quién sos?" — se muestra una vez por dispositivo, la primera
 * vez que se abre la app (o después de importar un backup / borrar datos).
 * No es una pantalla de login: no hay contraseña ni verificación, cualquiera
 * de los dos puede elegir cualquier perfil en cualquier dispositivo. Solo
 * decide qué rutina se muestra por defecto acá.
 */
export function ProfileGate({ onChoose }: { onChoose: (profile: Profile) => void }) {
  return (
    <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: 360, textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--ink)', color: 'var(--lime)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
          <Dumbbell size={24} aria-hidden />
        </div>
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>
          ¿Quién <em>entrena?</em>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>Elegí tu rutina. Podés cambiar de perfil cuando quieras desde el menú.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {PROFILES.map((profile) => (
            <button
              key={profile}
              type="button"
              onClick={() => onChoose(profile)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 18px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--foreground)',
                cursor: 'pointer',
              }}
            >
              <span
                aria-hidden
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--orange)', color: 'var(--ink)', display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0 }}
              >
                {PROFILE_LABELS[profile][0]}
              </span>
              {PROFILE_LABELS[profile]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
