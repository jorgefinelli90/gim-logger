'use client'

import { createContext, useContext } from 'react'
import type { Profile } from '@/types'

/**
 * Qué perfil (Jorge / Sebastián) muestra este dispositivo ahora mismo.
 *
 * Vive en un contexto, no en cada hook por separado, porque casi cada
 * pantalla de la app lo necesita (rutinas, ejercicios, historial,
 * estadísticas…) y pasarlo a mano por cada nivel de props sería tedioso y
 * propenso a que una pantalla nueva se olvide de filtrarlo. `AppShell` es el
 * único lugar que decide el valor real (a partir de `UserPreferences`,
 * local a este dispositivo) y solo renderiza sus hijos una vez que hay un
 * perfil elegido — por eso acá no hace falta contemplar `null`.
 */
const ProfileContext = createContext<{ profile: Profile; setProfile: (profile: Profile) => void } | null>(null)

export function ProfileProvider({
  profile,
  setProfile,
  children,
}: {
  profile: Profile
  setProfile: (profile: Profile) => void
  children: React.ReactNode
}) {
  return <ProfileContext.Provider value={{ profile, setProfile }}>{children}</ProfileContext.Provider>
}

export function useActiveProfile(): { profile: Profile; setProfile: (profile: Profile) => void } {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useActiveProfile debe usarse dentro de <ProfileProvider>.')
  return context
}
