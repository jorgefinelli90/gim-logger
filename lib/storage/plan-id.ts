import type { PlanDayId, Profile } from '@/types'

/**
 * Jorge usaba la app antes de que existiera el concepto de perfil, así que
 * sus ids ya están guardados sin prefijo (`gimnasio-dia-1`, `calistenia-
 * flexiones`). Para no reescribir su historial, Jorge sigue siendo la
 * excepción sin prefijo; cualquier otro perfil (Sebastián, y el que venga
 * después) lleva `${profile}-` adelante, garantizando que nunca choque con
 * los ids de Jorge ni con los de otro perfil nuevo. Se usa tanto para planes
 * (`gimnasio-dia-1` -> `sebas-gimnasio-dia-1`) como para ejercicios de
 * calistenia compartidos entre perfiles (`calistenia-flexiones` ->
 * `sebas-calistenia-flexiones`).
 */
function prefixedId(profile: Profile, key: string): string {
  return profile === 'jorge' ? key : `${profile}-${key}`
}

export function planStorageId(profile: Profile, dayId: PlanDayId): string {
  return prefixedId(profile, dayId)
}

/** Id de almacenamiento de un ejercicio de calistenia para este perfil — ver
 *  `prefixedId`. La búsqueda en el catálogo de GIFs sigue usando la clave SIN
 *  prefijo (`item.key`): el movimiento es el mismo para cualquier perfil, no
 *  hace falta duplicar la entrada del catálogo por cada uno. */
export function calisthenicsExerciseId(profile: Profile, key: string): string {
  return prefixedId(profile, key)
}
