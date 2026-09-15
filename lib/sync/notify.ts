'use client'

import { useEffect, useSyncExternalStore } from 'react'

/**
 * Aviso de "bajaron datos nuevos del servidor".
 *
 * Sin esto el sync sería invisible: la notebook lee IndexedDB al montar, el
 * pull termina medio segundo después y la pantalla seguiría mostrando el estado
 * viejo hasta navegar a otro lado. Los hooks de datos agregan `useSyncVersion()`
 * a sus dependencias y se recargan solos.
 *
 * Es un contador global y no un contexto a propósito: así los hooks no quedan
 * atados al orden de los providers ni rompen si se usan fuera de la app.
 */

let version = 0
const listeners = new Set<() => void>()

export function notifyDataPulled(): void {
  version += 1
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): number {
  return version
}

/** En el servidor siempre 0: no hay sync durante el prerender. */
function getServerSnapshot(): number {
  return 0
}

/** Cambia cada vez que el sync aplica cambios remotos. Útil en las deps de un
 *  efecto de carga para releer IndexedDB. */
export function useSyncVersion(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Vuelve a ejecutar `reload` cuando el sync baja cambios.
 *
 * Alternativa a meter la versión en las dependencias: para los hooks que ya
 * tienen una función de carga estable, suscribirse directamente dice lo que
 * pasa sin arrastrar una dependencia que el cuerpo del callback no usa.
 */
export function useSyncRefresh(reload: () => void): void {
  useEffect(() => subscribe(reload), [reload])
}
