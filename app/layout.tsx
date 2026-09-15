import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { getThemeInitScript } from '@/lib/theme/theme-script'

export const metadata: Metadata = {
  title: 'Iron Log · Tu entrenamiento',
  description: 'Tu rutina personal de gimnasio y calistenia, con seguimiento de ejercicios, descanso y notas.',
  icons: {
    icon: { url: '/icon.svg', type: 'image/svg+xml' },
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
      </head>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
