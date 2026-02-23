import type { Block } from '../types'
import { BlockRegistry } from '../registry/BlockRegistry'

interface RawHtmlOptions {
  title?: string
  includeTitle?: boolean
  preserveInternalClasses?: boolean
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Serialize blocks to plain HTML without block comment delimiters.
 * Suitable for preview rendering inside an iframe or for external consumers
 * that only need the rendered markup.
 *
 * Custom CSS (stored in `__customCSS`) is injected as a scoped `<style>` tag
 * before each block's markup, scoped to `#anchor` when available.
 */
export function blocksToRawHtml(blocks: Block[], options: RawHtmlOptions = {}): string {
  const renderedBlocks = blocks.map((block) => blockToHtml(block, options)).filter(Boolean).join('\n')
  if (!options.includeTitle) return renderedBlocks

  const title = options.title?.trim()
  if (!title) return renderedBlocks
  const titleHtml = `<h1>${escapeHtml(title)}</h1>`
  return renderedBlocks ? `${titleHtml}\n${renderedBlocks}` : titleHtml
}

function blockToHtml(block: Block, options: RawHtmlOptions): string {
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
      html = html.replace('<!--inner-->', blocksToRawHtml(block.innerBlocks, options))
    } else if (html.includes('<!-- inner block -->')) {
      const renderedInner = block.innerBlocks.map((child) => blockToHtml(child, options))
      let innerIndex = 0
      html = html.replace(/<!--\s*inner block\s*-->/g, () => renderedInner[innerIndex++] ?? '')
    }
  }

  const attrs = block.attributes as Record<string, unknown>
  const customCSS = attrs['__customCSS'] as string | undefined
  if (customCSS) {
    const anchor = attrs['anchor'] as string | undefined
    const scopedCss = anchor
      ? `#${anchor} { ${customCSS} }`
      : customCSS
    html = `<style>${scopedCss}</style>\n` + html
  }

  return options.preserveInternalClasses ? html : stripInternalEditorClasses(html)
}

function stripInternalEditorClasses(html: string): string {
  if (!html || !html.includes('editor-')) {
    return html
  }

  const container = document.createElement('div')
  container.innerHTML = html

  for (const node of container.querySelectorAll('[class]')) {
    const classAttr = node.getAttribute('class')
    if (!classAttr) continue
    const kept = classAttr
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .filter((token) => !token.startsWith('editor-'))

    if (kept.length === 0) {
      node.removeAttribute('class')
    } else {
      node.setAttribute('class', kept.join(' '))
    }
  }

  return container.innerHTML
}
