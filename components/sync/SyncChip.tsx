'use client'

import Link from 'next/link'
import { Check, Cloud, CloudUpload, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useSync } from './SyncProvider'

/** Estado del sync en la barra lateral. Lleva a Configuración de un toque,
 *  que es donde se resuelve cualquiera de estos estados. */
export function SyncChip({ onNavigate }: { onNavigate?: () => void }) {
  const { status, pending, error } = useSync()

  // En modo local puro no hay nada que informar: no ensuciamos la barra.
  if (status === 'off') return null

  const { icon: Icon, text, tone } =
    status === 'signed-out'
      ? { icon: Cloud, text: 'VINCULAR DISPOSITIVO', tone: '' }
      : status === 'syncing'
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
