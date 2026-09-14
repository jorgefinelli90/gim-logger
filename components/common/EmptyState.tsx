import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 10, padding: '64px 20px', textAlign: 'center', color: 'var(--muted)' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--muted-surface, var(--line))', display: 'grid', placeItems: 'center' }}>
        <Icon size={26} aria-hidden />
      </div>
      <h3 style={{ margin: 0, fontSize: 16, color: 'var(--foreground)' }}>{title}</h3>
      {description && <p style={{ margin: 0, maxWidth: 380, fontSize: 13 }}>{description}</p>}
      {action}
    </div>
  )
}
