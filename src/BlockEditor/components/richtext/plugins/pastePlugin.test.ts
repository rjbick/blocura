import { describe, expect, it, vi } from 'vitest'
import type { Block } from '../../../types'
import { createPastePlugin } from './pastePlugin'

function createClipboardEvent(html: string, text = '') {
  const preventDefault = vi.fn()
  const event = {
    clipboardData: {
      getData: (type: string) => {
        if (type === 'text/html') return html
        if (type === 'text/plain') return text
        return ''
      },
    },
    preventDefault,
  }

  return { event, preventDefault }
}

describe('createPastePlugin', () => {
  it('falls back to native paste when no block handler is provided', () => {
    const plugin = createPastePlugin()
    const handlePaste = plugin.props.handlePaste
    const { event, preventDefault } = createClipboardEvent('<p>Pasted</p>')

    const handled = handlePaste?.call(plugin, null as never, event as never, null as never)

    expect(handled).toBe(false)
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('prevents default and forwards parsed blocks when a handler is provided', () => {
    const onBlocks = vi.fn<(blocks: Block[]) => void>()
    const plugin = createPastePlugin({ onBlocks })
    const handlePaste = plugin.props.handlePaste
    const { event, preventDefault } = createClipboardEvent('<p>Pasted</p>')

    const handled = handlePaste?.call(plugin, null as never, event as never, null as never)

    expect(handled).toBe(true)
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(onBlocks).toHaveBeenCalledOnce()
    expect(onBlocks.mock.calls[0][0][0]?.name).toBe('core/paragraph')
  })
})
