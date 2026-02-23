import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { BlockEditor } from '../../index'
import type { Block } from '../../types'

describe('BlockEditor render stability', () => {
  it('renders a first block without entering an update loop', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const initialBlocks: Block[] = [
      {
        clientId: 'stability-1',
        name: 'core/separator',
        attributes: {},
        innerBlocks: [],
      },
    ]

    await act(async () => {
      root.render(<BlockEditor initialBlocks={initialBlocks} />)
    })

    expect(container.querySelector('[data-block="stability-1"]')).not.toBeNull()

    await act(async () => {
      root.unmount()
    })
  })

  it('applies a preset layout when initializing an empty columns block', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const onChange = vi.fn()

    const initialBlocks: Block[] = [
      {
        clientId: 'columns-root',
        name: 'core/columns',
        attributes: {},
        innerBlocks: [],
      },
    ]

    await act(async () => {
      root.render(<BlockEditor initialBlocks={initialBlocks} onChange={onChange} />)
    })

    const presetButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Select 33 / 67 columns layout"]'
    )
    if (!presetButton) throw new Error('Columns preset layout button was not rendered.')

    await act(async () => {
      presetButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(
      onChange.mock.calls.some((call) => {
        const blocks = call[0] as Block[]
        const columnsBlock = blocks.find((candidate) => candidate.clientId === 'columns-root')
        if (!columnsBlock) return false
        const widths = columnsBlock.innerBlocks
          .map((candidate) => String((candidate.attributes as { width?: unknown }).width ?? ''))
        return widths.length === 2 && widths[0] === '33.33%' && widths[1] === '66.67%'
      })
    ).toBe(true)

    await act(async () => {
      root.unmount()
    })
  })
})
