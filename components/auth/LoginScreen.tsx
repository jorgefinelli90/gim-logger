'use client'

import { useState } from 'react'
import { Dumbbell, LoaderCircle, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Pantalla única de entrada: usuario + contraseña. No hay registro ni
 * recuperación — son dos cuentas fijas y conocidas (ver `lib/auth/accounts.ts`).
 *
 * La sesión queda guardada en el dispositivo y se renueva sola, así que esto
 * se ve una sola vez por aparato, no en cada visita.
 */
export function LoginScreen({
  onSubmit,
  configured,
}: {
  onSubmit: (username: string, password: string) => Promise<{ ok: boolean; message: string }>
  configured: boolean
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    const result = await onSubmit(username, password)
    // Si sale bien no se apaga `busy`: la pantalla se desmonta sola cuando la
    // sesión queda lista, y así no parpadea el botón en el medio.
    if (!result.ok) {
      setError(result.message)
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', padding: '40px 20px' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 320 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--ink)', color: 'var(--lime)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <Dumbbell size={24} aria-hidden />
          </div>
          <h1 style={{ fontSize: 26, margin: 0 }}>
            Iron <em>Log.</em>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>Entrá para ver tu rutina.</p>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <Label htmlFor="login-user">Usuario</Label>
            <Input
              id="login-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              spellCheck={false}
              required
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="login-password">Contraseña</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" disabled={busy || !username.trim() || !password} style={{ marginTop: 4 }}>
            {busy ? <LoaderCircle size={15} className="spin" aria-hidden /> : <LogIn size={15} aria-hidden />}
            {busy ? 'Entrando…' : 'Entrar'}
          </Button>
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, marginTop: 14, textAlign: 'center' }}>
            {error}
          </p>
        )}

        {!configured && (
          <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 18, lineHeight: 1.5, textAlign: 'center' }}>
            Este dispositivo no tiene configurada la sincronización, así que el login no va a funcionar. Faltan las
            variables de Supabase (<code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>).
          </p>
        )}
      </form>
    </div>
  )
}
