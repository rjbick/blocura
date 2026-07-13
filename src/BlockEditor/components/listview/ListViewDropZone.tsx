interface ListViewDropZoneProps {
  active?: boolean
}

export function ListViewDropZone({ active = false }: ListViewDropZoneProps) {
  return (
    <div
      aria-hidden
      style={{
        height: active ? 6 : 0,
        margin: active ? '2px 8px' : '0 8px',
        borderRadius: 999,
        backgroundColor: active ? 'rgba(var(--editor-components-color-accent-rgb), 0.4)' : 'transparent',
        transition: 'background-color 0.1s ease, height 0.1s ease, margin 0.1s ease',
      }}
    />
  )
}
