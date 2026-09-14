'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Calendar, Dumbbell, PersonStanding, Target } from 'lucide-react'

const ITEMS = [
  { href: '/', label: 'Hoy', icon: Target },
  { href: '/calendario', label: 'Calendario', icon: Calendar },
  { href: '/rutinas', label: 'Rutinas', icon: Dumbbell },
  { href: '/calistenia', label: 'Calistenia', icon: PersonStanding },
  { href: '/estadisticas', label: 'Progreso', icon: BarChart3 },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link key={item.href} href={item.href} className={`bottom-nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
            <item.icon aria-hidden />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
