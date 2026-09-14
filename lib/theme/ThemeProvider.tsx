'use client'

import { useEffect } from 'react'
import type { ThemePreference } from '@/types'

function applyTheme(theme: ThemePreference) {
  const resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme
  document.documentElement.setAttribute('data-theme', resolved)
}

/** Keeps <html data-theme> in sync with the stored preference after mount (initial paint is handled by the inline script in layout.tsx). */
export function ThemeProvider({ theme, children }: { theme: ThemePreference; children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyTheme('system')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme])

  return <>{children}</>
}
