import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import {
  InspectorControlsProvider,
  useInspectorControls,
  useInspectorControlsSlot,
} from './InspectorControlsContext'

describe('InspectorControlsContext', () => {
  it('registers controls without entering a render loop', async () => {
    let renderCount = 0

    function ControlOwner() {
      renderCount += 1
      useInspectorControls(
        'client-1',
        () => <div data-testid="panel-content">Panel</div>,
        []
      )
      return null
    }

    function SlotConsumer() {
      const content = useInspectorControlsSlot('client-1')
      return <div data-testid="slot">{content}</div>
    }

    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <InspectorControlsProvider>
          <ControlOwner />
          <SlotConsumer />
        </InspectorControlsProvider>
      )
    })

    expect(container.querySelector('[data-testid="panel-content"]')).not.toBeNull()
    expect(renderCount).toBeLessThan(10)

    await act(async () => {
      root.unmount()
    })
  })
})
