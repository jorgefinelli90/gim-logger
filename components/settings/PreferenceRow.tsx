export function PreferenceRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{label}</p>
        {description && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>{description}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}
