'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, X } from 'lucide-react'
import { primaryNavForProfile, SECONDARY_NAV, SETTINGS_NAV } from './nav-items'
import { SyncChip } from '@/components/sync/SyncChip'
import { ProfileSwitcher } from '@/components/profile/ProfileSwitcher'
import { useActiveProfile } from '@/lib/profile/ProfileContext'

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
  const { profile } = useActiveProfile()
  const primaryNav = primaryNavForProfile(profile)

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
      <ProfileSwitcher />
      <nav>
        {primaryNav.map((item) => (
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
        <SyncChip onNavigate={onClose} />
        <Link href={SETTINGS_NAV.href} className="settings" onClick={onClose}>
          <SETTINGS_NAV.icon aria-hidden />
          {SETTINGS_NAV.label}
        </Link>
      </div>
    </aside>
  )
}
