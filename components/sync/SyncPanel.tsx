'use client'

import { useState } from 'react'
import { Check, CloudOff, Cloud, LoaderCircle, Mail, RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSync } from './SyncProvider'

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
  const { status, email, lastSyncAt, pending, error, signIn, signOut, sync } = useSync()
  const [inputEmail, setInputEmail] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [sending, setSending] = useState(false)

  if (status === 'off') {
    return (
      <div style={cardStyle}>
        <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
          <CloudOff size={16} aria-hidden /> Sincronización desactivada
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
          Este dispositivo guarda todo localmente. Para ver tus entrenamientos también en el celular, agregá las
          credenciales de Supabase en <code>.env.local</code> y reiniciá la app.
        </p>
      </div>
    )
  }

  if (status === 'signed-out') {
    return (
      <div style={cardStyle}>
        <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
          <Cloud size={16} aria-hidden /> Vincular este dispositivo
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
          Te mandamos un link por correo. Lo abrís una sola vez y este dispositivo queda vinculado.
        </p>
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            setSending(true)
            const result = await signIn(inputEmail)
            setMessage({ ok: result.ok, text: result.message })
            setSending(false)
          }}
          style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}
        >
          <label htmlFor="sync-email" className="sr-only">
            Tu correo
          </label>
          <Input
            id="sync-email"
            type="email"
            required
            placeholder="tu@correo.com"
            value={inputEmail}
            onChange={(event) => setInputEmail(event.target.value)}
            style={{ flex: '1 1 200px' }}
          />
          <Button type="submit" disabled={sending || inputEmail.trim().length === 0}>
            {sending ? <LoaderCircle size={15} className="spin" aria-hidden /> : <Mail size={15} aria-hidden />}
            {sending ? 'Enviando…' : 'Enviarme el link'}
          </Button>
        </form>
        {message && (
          <p
            role="status"
            style={{ fontSize: 13, marginTop: 10, color: message.ok ? 'var(--foreground)' : 'var(--danger)' }}
          >
            {message.text}
          </p>
        )}
      </div>
    )
  }

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
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{email}</p>
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
