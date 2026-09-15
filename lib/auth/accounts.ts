import type { Profile } from '@/types'

/**
 * Las dos cuentas fijas de la app. No hay registro ni recuperación de
 * contraseña: son dos personas conocidas, la lista vive acá y punto.
 *
 * El "usuario" que se escribe en la pantalla de login se traduce a un correo
 * interno que nunca recibe mail — existe solo porque Supabase Auth necesita
 * una identidad real para emitir una sesión, y sin sesión no hay sincronización
 * posible. Esos dos usuarios ya están creados en Supabase con la contraseña
 * hasheada (ver la migración `create_fixed_accounts`).
 */
export interface Account {
  /** Lo que se tipea en el login. */
  username: string
  /** Identidad interna en Supabase Auth. */
  email: string
  /** Qué rutina abre esta cuenta por defecto. */
  profile: Profile
  label: string
}

export const ACCOUNTS: Account[] = [
  { username: 'jor', email: 'jor@ironlog.app', profile: 'jorge', label: 'Jorge' },
  { username: 'sebas', email: 'sebas@ironlog.app', profile: 'sebas', label: 'Sebastián' },
]

/** Tolerante a mayúsculas y espacios de más: se escribe en el celular, con apuro. */
export function findAccount(username: string): Account | undefined {
  const normalized = username.trim().toLowerCase()
  return ACCOUNTS.find((a) => a.username === normalized)
}

export function accountForEmail(email: string | null | undefined): Account | undefined {
  if (!email) return undefined
  return ACCOUNTS.find((a) => a.email === email.toLowerCase())
}
