'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { usePreferences } from '@/hooks/usePreferences'
import { PreferenceRow } from '@/components/settings/PreferenceRow'
import { ExportImportPanel } from '@/components/settings/ExportImportPanel'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { ThemePreference, WeekStartDay, WeightUnit } from '@/types'

export default function ConfiguracionPage() {
  const { preferences, setPreferences, loaded } = usePreferences()

  if (!loaded) return null

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">TU APP</p>
          <h1>
            <em>Configuración.</em>
          </h1>
        </div>
      </header>

      <div style={{ maxWidth: 560, marginTop: 20 }}>
        <section>
          <h2 style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 24 }}>General</h2>

          <PreferenceRow label="Unidades" description="Cómo se muestra y registra el peso">
            <Select items={{ kg: 'kg', lb: 'lb' }} value={preferences.units} onValueChange={(v) => v && setPreferences({ units: v as WeightUnit })}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="lb">lb</SelectItem>
              </SelectContent>
            </Select>
          </PreferenceRow>

          <PreferenceRow label="Primer día de la semana">
            <Select items={{ monday: 'Lunes', sunday: 'Domingo' }} value={preferences.firstDayOfWeek} onValueChange={(v) => v && setPreferences({ firstDayOfWeek: v as WeekStartDay })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Lunes</SelectItem>
                <SelectItem value="sunday">Domingo</SelectItem>
              </SelectContent>
            </Select>
          </PreferenceRow>

          <PreferenceRow label="Zona horaria" description="Detectada automáticamente">
            <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{preferences.timezone}</span>
          </PreferenceRow>

          <PreferenceRow label="Tema">
            <Select items={{ light: 'Claro', dark: 'Oscuro', system: 'Sistema' }} value={preferences.theme} onValueChange={(v) => v && setPreferences({ theme: v as ThemePreference })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Oscuro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </PreferenceRow>

          <PreferenceRow label="Recordatorio visual" description="Mostrar un aviso en Hoy a partir de esta hora">
            <Input
              type="time"
              value={preferences.reminderTime ?? ''}
              onChange={(e) => setPreferences({ reminderTime: e.target.value || null })}
              className="w-28"
              aria-label="Hora de recordatorio"
            />
          </PreferenceRow>
        </section>

        <section>
          <h2 style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 30 }}>Temporizador de descanso</h2>

          <PreferenceRow label="Descanso predeterminado" description="Segundos cuando un ejercicio no define descanso">
            <Input
              type="number"
              min={0}
              value={preferences.defaultRestSeconds}
              onChange={(e) => setPreferences({ defaultRestSeconds: Number(e.target.value) || 0 })}
              className="w-24"
              aria-label="Descanso predeterminado en segundos"
            />
          </PreferenceRow>

          <PreferenceRow label="Sonido">
            <Switch checked={preferences.timerSoundEnabled} onCheckedChange={(v) => setPreferences({ timerSoundEnabled: Boolean(v) })} />
          </PreferenceRow>

          <PreferenceRow label="Vibración" description="En dispositivos que la soportan">
            <Switch checked={preferences.timerVibrationEnabled} onCheckedChange={(v) => setPreferences({ timerVibrationEnabled: Boolean(v) })} />
          </PreferenceRow>
        </section>

        <section>
          <h2 style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 30 }}>Rutinas</h2>
          <PreferenceRow label="Rutina de calistenia" description="Agregar, editar, eliminar o reordenar ejercicios">
            <Link href="/calistenia" style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none' }}>
              Editar <ArrowRight size={14} />
            </Link>
          </PreferenceRow>
        </section>

        <section style={{ marginTop: 30, marginBottom: 40 }}>
          <h2 style={{ fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Datos</h2>
          <ExportImportPanel />
        </section>
      </div>
    </>
  )
}
