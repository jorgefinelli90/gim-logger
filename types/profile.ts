/**
 * Iron Log pasó de ser una app de un solo usuario a compartirse entre dos
 * amigos de gimnasio. No hay noción de cuentas separadas con datos privados:
 * ambos perfiles son visibles y editables desde cualquier dispositivo
 * vinculado (ver docs/sincronizacion.md) — la única razón de tener un
 * `Profile` es mostrar la rutina de cada uno por separado, no aislar datos.
 */
export type Profile = 'jorge' | 'sebas'

export const PROFILES: Profile[] = ['jorge', 'sebas']

export const PROFILE_LABELS: Record<Profile, string> = {
  jorge: 'Jorge',
  sebas: 'Sebastián',
}

export function isProfile(value: unknown): value is Profile {
  return value === 'jorge' || value === 'sebas'
}
