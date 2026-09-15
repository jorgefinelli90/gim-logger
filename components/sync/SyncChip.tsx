'use client'

import Link from 'next/link'
import { Check, CloudUpload, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useSync } from './SyncProvider'

/** Estado del sync en la barra lateral. Lleva a Configuración de un toque,
 *  que es donde se resuelve cualquiera de estos estados. */
export function SyncChip({ onNavigate }: { onNavigate?: () => void }) {
  const { status, pending, error } = useSync()

  // Sin credenciales no hay nada que informar; sin sesión ni siquiera se ve
  // la barra (la app muestra el login antes).
  if (status === 'off' || status === 'signed-out' || status === 'restoring') return null

  const { icon: Icon, text, tone } =
    status === 'syncing'
        ? { icon: LoaderCircle, text: 'SINCRONIZANDO…', tone: '' }
        : status === 'error'
          ? { icon: TriangleAlert, text: 'ERROR AL SINCRONIZAR', tone: 'is-error' }
          : pending > 0
            ? { icon: CloudUpload, text: `${pending} SIN SUBIR`, tone: 'is-pending' }
            : { icon: Check, text: 'TODO SINCRONIZADO', tone: '' }

  return (
    <Link href="/configuracion" className={`sync-chip ${tone}`} onClick={onNavigate} title={error ?? undefined}>
      <Icon aria-hidden className={status === 'syncing' ? 'spin' : undefined} />
      {text}
    </Link>
  )
}
