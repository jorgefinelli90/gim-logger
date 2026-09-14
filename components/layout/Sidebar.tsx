'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, X } from 'lucide-react'
import { PRIMARY_NAV, SECONDARY_NAV, SETTINGS_NAV } from './nav-items'

interface SidebarProps {
  open: boolean
  onClose: () => void
  weeklyPercent: number
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar({ open, onClose, weeklyPercent }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">
          <Dumbbell />
        </div>
        <div>
          <strong>IRON LOG</strong>
          <span>ENTRENAMIENTO PERSONAL</span>
        </div>
        <button className="close-menu" onClick={onClose} aria-label="Cerrar menú">
          <X />
        </button>
      </div>
      <nav>
        {PRIMARY_NAV.map((item) => (
          <Link key={item.href} href={item.href} className={`nav-item ${isActive(pathname, item.href) ? 'active' : ''}`} onClick={onClose}>
            <item.icon aria-hidden />
            {item.label}
          </Link>
        ))}
        <div style={{ height: 1, background: 'var(--line)', margin: '8px 4px', opacity: 0.6 }} />
        {SECONDARY_NAV.map((item) => (
          <Link key={item.href} href={item.href} className={`nav-item ${isActive(pathname, item.href) ? 'active' : ''}`} onClick={onClose}>
            <item.icon aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="week-label">
          <span>ESTA SEMANA</span>
          <b>{weeklyPercent}%</b>
        </div>
        <div className="progress-line">
          <i style={{ width: `${weeklyPercent}%` }} />
        </div>
        <p>La constancia gana. Un día a la vez.</p>
        <Link href={SETTINGS_NAV.href} className="settings" onClick={onClose}>
          <SETTINGS_NAV.icon aria-hidden />
          {SETTINGS_NAV.label}
        </Link>
      </div>
    </aside>
  )
}
