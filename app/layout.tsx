import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'
import { getThemeInitScript } from '@/lib/theme/theme-script'

export const metadata: Metadata = {
  title: 'Iron Log · Tu entrenamiento',
  description: 'Tu rutina personal de gimnasio y calistenia, con seguimiento de ejercicios, descanso y notas.',
  icons: {
    // El SVG es el favicon de verdad — nítido en cualquier tamaño y el único
    // que respeta el ícono de pestaña oscuro/claro del sistema operativo.
    icon: { url: '/icon.svg', type: 'image/svg+xml' },
    // Respaldo para lo que no sabe pedir un SVG como favicon (algunos
    // rastreadores, exportadores de marcadores, Safari de escritorio en
    // ciertos contextos): sin esto piden /favicon.ico igual y reciben un
    // 404, y el navegador cae en un ícono genérico.
    shortcut: { url: '/favicon.ico' },
    // Lo que se ve si Jorge o Sebastián agregan la app a la pantalla de
    // inicio del celular — un uso real para una app que se abre a diario.
    apple: { url: '/apple-icon.png' },
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
