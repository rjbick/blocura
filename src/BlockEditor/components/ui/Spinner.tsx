export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span
      aria-label="Loading"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2px solid rgba(0,0,0,0.15)',
        borderTopColor: 'var(--editor-components-color-accent)',
        display: 'inline-block',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  )
}
