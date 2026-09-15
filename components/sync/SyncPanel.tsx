'use client'

import { Check, CloudOff, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSync } from './SyncProvider'
import { accountForEmail } from '@/lib/auth/accounts'

/** "hace 2 min" es más útil que un timestamp cuando lo que querés saber es si
 *  el teléfono ya subió la serie que acabás de anotar. */
function relativeTime(iso: string | null): string {
  if (!iso) return 'nunca'
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 10) return 'recién'
  if (seconds < 60) return `hace ${seconds} s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 16,
  marginTop: 12,
}

export function SyncPanel() {
  const { status, email, lastSyncAt, pending, error, signOut, sync } = useSync()

  if (status === 'off') {
    return (
      <div style={cardStyle}>
        <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
          <CloudOff size={16} aria-hidden /> Sincronización desactivada
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
          A este dispositivo le faltan las credenciales de Supabase
          (<code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>), así que guarda
          todo localmente y nada se comparte con los otros aparatos.
        </p>
      </div>
    )
  }

  // 'signed-out' y 'restoring' no llegan acá: sin sesión la app muestra la
  // pantalla de login antes de renderizar Configuración.
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
            {status === 'syncing' ? (
              <LoaderCircle size={16} className="spin" aria-hidden />
            ) : status === 'error' ? (
              <TriangleAlert size={16} aria-hidden style={{ color: 'var(--danger)' }} />
            ) : (
              <Check size={16} aria-hidden style={{ color: '#5f7a12' }} />
            )}
            {status === 'syncing' ? 'Sincronizando…' : status === 'error' ? 'Error al sincronizar' : 'Sincronizado'}
          </p>
          {/* El correo interno (jor@ironlog.app) no le dice nada a nadie —
              se muestra el usuario con el que se entró. */}
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {accountForEmail(email) ? `Sesión de ${accountForEmail(email)!.label}` : email}
          </p>
        </div>
        <Button variant="outline" onClick={sync} disabled={status === 'syncing'}>
          <RefreshCw size={15} aria-hidden /> Sincronizar ahora
        </Button>
      </div>

      <dl style={{ display: 'flex', gap: 24, marginTop: 14, fontSize: 13 }}>
        <div>
          <dt style={{ color: 'var(--muted)' }}>Última vez</dt>
          <dd style={{ fontWeight: 600, marginTop: 2 }}>{relativeTime(lastSyncAt)}</dd>
        </div>
        <div>
          <dt style={{ color: 'var(--muted)' }}>Sin subir</dt>
          <dd style={{ fontWeight: 600, marginTop: 2 }}>
            {pending === 0 ? 'nada' : `${pending} ${pending === 1 ? 'cambio' : 'cambios'}`}
          </dd>
        </div>
      </dl>

      {error && (
        <p role="alert" style={{ fontSize: 13, color: 'var(--danger)', marginTop: 12 }}>
          {error}
        </p>
      )}

      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 14, lineHeight: 1.5 }}>
        Tus datos siguen guardados en este dispositivo aunque te desvincules: cerrar sesión no borra nada.
      </p>
      <Button variant="outline" onClick={signOut} style={{ marginTop: 10 }}>
        Cerrar sesión
      </Button>
    </div>
  )
}
