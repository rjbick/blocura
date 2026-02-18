import type { Block } from '../types'
import { BlockRegistry } from '../registry/BlockRegistry'

/**
 * Serialize blocks to plain HTML without WordPress block comment delimiters.
 * Suitable for preview rendering inside an iframe or for external consumers
 * that only need the rendered markup.
 *
 * Custom CSS (stored in `__customCSS`) is injected as a scoped `<style>` tag
 * before each block's markup, scoped to `#anchor` if an anchor is set,
 * otherwise to `.wp-block-name`.
 */
export function blocksToRawHtml(blocks: Block[]): string {
  return blocks.map(blockToHtml).filter(Boolean).join('\n')
}

function blockToHtml(block: Block): string {
  const def = BlockRegistry.get(block.name)

  if (!def) {
    // Unknown block — return originalContent if available
    return block.originalContent ?? ''
  }

  let html = ''
  try {
    html = def.save({ attributes: block.attributes, innerBlocks: block.innerBlocks })
  } catch {
    return block.originalContent ?? ''
  }

  // Inject inner blocks HTML if the save() output contains a placeholder
  // (Some container blocks rely on inner block markup being interpolated).
  // If inner blocks exist but save() already includes their markup, skip.
  if (block.innerBlocks.length > 0) {
    if (html.includes('<!--inner-->')) {
      html = html.replace('<!--inner-->', blocksToRawHtml(block.innerBlocks))
    } else if (html.includes('<!-- inner block -->')) {
      const renderedInner = block.innerBlocks.map(blockToHtml)
      let innerIndex = 0
      html = html.replace(/<!--\s*inner block\s*-->/g, () => renderedInner[innerIndex++] ?? '')
    }
  }

  const attrs = block.attributes as Record<string, unknown>
  const customCSS = attrs['__customCSS'] as string | undefined
  if (customCSS) {
    const anchor = attrs['anchor'] as string | undefined
    const blockClass = `wp-block-${block.name.replace('core/', '').replace('/', '-')}`
    const scope = anchor ? `#${anchor}` : `.${blockClass}`
    html = `<style>${scope} { ${customCSS} }</style>\n` + html
  }

  return html
}
