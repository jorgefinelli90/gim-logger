'use client'

import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { buildBackup, importBackup, validateBackupPayload, type BackupPayload } from '@/lib/export/backup'
import { downloadTextFile } from '@/lib/export/download'
import { buildHistoryCsv } from '@/lib/export/csv'
import { buildWeeklySummary } from '@/lib/export/weekly-summary'
import { clearAllStores } from '@/lib/storage/db'
import { listExercises } from '@/lib/storage/repositories/exercise-repo'
import { listSessions } from '@/lib/storage/repositories/session-repo'
import { listAllSets } from '@/lib/storage/repositories/set-repo'
import { useActiveProfile } from '@/lib/profile/ProfileContext'
import { PROFILE_LABELS } from '@/types'

export function ExportImportPanel() {
  const { profile } = useActiveProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<BackupPayload | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleExportJson() {
    // El backup JSON es del dispositivo entero (los dos perfiles): sirve para
    // restaurar todo, no para leerlo persona por persona.
    const backup = await buildBackup()
    downloadTextFile(`iron-log-backup-${backup.exportedAt.slice(0, 10)}.json`, JSON.stringify(backup, null, 2), 'application/json')
    setStatus('Datos exportados como JSON.')
  }

  async function handleExportCsv() {
    // El CSV y el resumen semanal sí son por perfil: mezclar el historial de
    // Jorge y Sebastián en una sola planilla no tendría sentido para leerla.
    const [exercises, sessions, sets] = await Promise.all([listExercises(profile), listSessions(), listAllSets()])
    const exerciseMap = Object.fromEntries(exercises.map((e) => [e.id, e]))
    const profileSessions = sessions.filter((s) => s.profile === profile)
    const profileSets = sets.filter((s) => s.profile === profile)
    const csv = buildHistoryCsv(profileSets, profileSessions, exerciseMap)
    downloadTextFile(`iron-log-historial-${PROFILE_LABELS[profile].toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv')
    setStatus(`Historial de ${PROFILE_LABELS[profile]} exportado como CSV.`)
  }

  async function handleWeeklySummary() {
    const [exercises, sessions, sets] = await Promise.all([listExercises(profile), listSessions(), listAllSets()])
    const exerciseMap = Object.fromEntries(exercises.map((e) => [e.id, e]))
    const profileSessions = sessions.filter((s) => s.profile === profile)
    const profileSets = sets.filter((s) => s.profile === profile)
    const summary = buildWeeklySummary(profileSessions, profileSets, exerciseMap)
    downloadTextFile(`iron-log-resumen-semanal-${PROFILE_LABELS[profile].toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`, summary, 'text/plain')
    setStatus('Resumen semanal descargado.')
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result))
        const result = validateBackupPayload(json)
        if (!result.valid) {
          setStatus(`Archivo inválido: ${result.error}`)
          return
        }
        setPendingImport(result.data)
        setConfirmOpen(true)
      } catch {
        setStatus('El archivo no es un JSON válido.')
      }
    }
    reader.readAsText(file)
  }

  async function confirmImport() {
    if (!pendingImport) return
    await importBackup(pendingImport)
    setConfirmOpen(false)
    setStatus('Datos importados. Recargando…')
    window.location.reload()
  }

  async function handleResetAll() {
    await clearAllStores()
    setStatus('Todos los datos fueron borrados. Recargando…')
    window.location.reload()
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="outline" onClick={handleExportJson}>
          <Download /> Exportar todo (JSON)
        </Button>
        <Button variant="outline" onClick={handleExportCsv}>
          <FileSpreadsheet /> Exportar historial (CSV)
        </Button>
        <Button variant="outline" onClick={handleWeeklySummary}>
          <Download /> Resumen semanal
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload /> Importar JSON
        </Button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileSelected} />
      </div>

      {status && <p style={{ fontSize: 12, color: 'var(--muted)' }}>{status}</p>}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reemplazar todos tus datos?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a importar un respaldo de {pendingImport?.exportedAt ? new Date(pendingImport.exportedAt).toLocaleDateString('es') : ''}. Esto reemplaza por completo tus ejercicios, rutinas,
              historial y preferencias actuales. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Reemplazar datos</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div style={{ marginTop: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive"><Trash2 /> Borrar todos los datos</Button>} />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Borrar todos los datos de Iron Log?</AlertDialogTitle>
              <AlertDialogDescription>Se eliminan ejercicios, rutinas, historial, notas y preferencias guardados en este dispositivo. Esta acción no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetAll}>Borrar todo</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
