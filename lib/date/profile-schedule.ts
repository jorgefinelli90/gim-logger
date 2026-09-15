import type { Profile, SessionType } from '@/types'

/**
 * Horario semanal FIJO, uno por perfil — Jorge y Sebastián entrenan días
 * distintos por defecto. Esto es el default de cada día, no un límite: en
 * cualquier día (incluido uno de descanso) se puede elegir otra rutina desde
 * el selector "cambiar rutina de hoy" — ver `PROFILE_PLAN_DAYS` más abajo,
 * que es la lista de opciones disponibles, y `hooks/useEffectiveSessionType.ts`.
 *
 * Asunción sin confirmar explícitamente: para Sebastián solo se especificaron
 * los 4 días de gimnasio (Mar/Jue/Vie/Sáb) como default fijo; Dom/Lun/Mié
 * quedan en descanso por default, aunque en esos días puede igual elegir
 * gimnasio o calistenia manualmente. Si en realidad tiene un día fijo más,
 * decilo y se ajusta.
 */
const SCHEDULES: Record<Profile, Record<number, SessionType>> = {
  jorge: {
    0: 'descanso',
    1: 'calistenia',
    2: 'gimnasio-dia-1',
    3: 'calistenia',
    4: 'gimnasio-dia-2',
    5: 'calistenia',
    6: 'gimnasio-dia-3',
  },
  sebas: {
    0: 'descanso',
    1: 'descanso',
    2: 'gimnasio-dia-1',
    3: 'descanso',
    4: 'gimnasio-dia-2',
    5: 'gimnasio-dia-3',
    6: 'gimnasio-dia-4',
  },
}

export function scheduledTypeForWeekday(profile: Profile, weekday: number): SessionType {
  return SCHEDULES[profile][weekday]
}

/** Los días de rutina (sin "descanso") que tiene cada perfil, en orden — para
 *  listar rutinas y para ofrecer el selector de "cambiar la rutina de hoy".
 *  Calistenia entra para los dos: no es un día fijo del horario semanal de
 *  Sebastián, pero sí una opción disponible para sus días libres. */
const PROFILE_PLAN_DAYS: Record<Profile, SessionType[]> = {
  jorge: ['calistenia', 'gimnasio-dia-1', 'gimnasio-dia-2', 'gimnasio-dia-3'],
  sebas: ['gimnasio-dia-1', 'gimnasio-dia-2', 'gimnasio-dia-3', 'gimnasio-dia-4', 'calistenia'],
}

export function planDaysForProfile(profile: Profile): SessionType[] {
  return PROFILE_PLAN_DAYS[profile]
}

/** Cuántos días de rutina tiene el horario semanal fijo de ese perfil — Jorge
 *  entrena 6 (3 calistenia + 3 gimnasio), Sebastián 4 (todo gimnasio). Se usa
 *  para el "X/N esta semana" del dashboard y las estadísticas. */
export function trainingDaysPerWeek(profile: Profile): number {
  return Object.values(SCHEDULES[profile]).filter((t) => t !== 'descanso').length
}
