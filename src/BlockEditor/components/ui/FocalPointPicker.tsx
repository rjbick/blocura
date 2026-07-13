import { useCallback, useRef } from 'react'

interface FocalPoint {
  x: number
  y: number
}

interface FocalPointPickerProps {
  value: FocalPoint
  onChange: (value: FocalPoint) => void
  /** When provided, renders a draggable point over the image itself. */
  imageUrl?: string
}

const clamp01 = (value: number) => Math.max(0, Math.min(value, 1))

export function FocalPointPicker({ value, onChange, imageUrl }: FocalPointPickerProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const updateFromPointer = useCallback(
    (event: React.PointerEvent) => {
      const surface = surfaceRef.current
      if (!surface) return
      const rect = surface.getBoundingClientRect()
      onChange({
        x: clamp01((event.clientX - rect.left) / rect.width),
        y: clamp01((event.clientY - rect.top) / rect.height),
      })
    },
    [onChange]
  )

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {imageUrl ? (
        <div
          ref={surfaceRef}
          role="button"
          aria-label="Focal point"
          style={{
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            cursor: 'crosshair',
            userSelect: 'none',
            touchAction: 'none',
          }}
          onPointerDown={(event) => {
            draggingRef.current = true
            event.currentTarget.setPointerCapture(event.pointerId)
            updateFromPointer(event)
          }}
          onPointerMove={(event) => {
            if (draggingRef.current) updateFromPointer(event)
          }}
          onPointerUp={(event) => {
            draggingRef.current = false
            event.currentTarget.releasePointerCapture(event.pointerId)
          }}
        >
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            style={{ display: 'block', width: '100%', maxHeight: 140, objectFit: 'cover' }}
          />
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: `${value.x * 100}%`,
              top: `${value.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '2px solid #fff',
              backgroundColor: 'var(--editor-components-color-accent)',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
              pointerEvents: 'none',
            }}
          />
        </div>
      ) : null}
      <input type="range" min={0} max={100} aria-label="Focal point horizontal position" value={Math.round(value.x * 100)} onChange={(event) => onChange({ ...value, x: Number(event.target.value) / 100 })} />
      <input type="range" min={0} max={100} aria-label="Focal point vertical position" value={Math.round(value.y * 100)} onChange={(event) => onChange({ ...value, y: Number(event.target.value) / 100 })} />
    </div>
  )
}
