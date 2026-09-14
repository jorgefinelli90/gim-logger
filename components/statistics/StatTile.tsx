import type { LucideIcon } from 'lucide-react'

interface StatTileProps {
  icon: LucideIcon
  label: string
  value: string | number
  hint?: string
}

export function StatTile({ icon: Icon, label, value, hint }: StatTileProps) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase' }}>
        <Icon size={14} aria-hidden />
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: 'var(--foreground)', letterSpacing: '-.03em' }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{hint}</div>}
    </div>
  )
}
