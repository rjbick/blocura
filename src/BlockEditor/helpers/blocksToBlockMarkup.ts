import type { Block, BlockAttributeSchema } from '../types'
import { BlockRegistry } from '../registry/BlockRegistry'

// ─── Attribute serialization ──────────────────────────────────────────────────

/**
 * Serialize block attributes for inclusion in the block comment.
 * Strips keys that equal their schema defaults, are blank, are null/undefined,
 * or start with '__' (internal/editor-only attrs).
 */
function serializeBlockAttributes(
  attrs: Record<string, unknown>,
  schema: Record<string, BlockAttributeSchema>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [key, val] of Object.entries(attrs)) {
    // Skip internal editor attrs
    if (key.startsWith('__')) continue
    // Skip undefined / null / empty string
    if (val === undefined || val === null || val === '') continue
    // Skip if value equals the schema default
    const schemaDef = schema[key]
    if (schemaDef?.default !== undefined && schemaDef.default === val) continue
    out[key] = val
  }

  return out
}

// ─── Single block serialization ───────────────────────────────────────────────

function blockToMarkup(block: Block): string {
  const def = BlockRegistry.get(block.name)

  // Unknown block — preserve originalContent wrapped in WP fallback comment
  if (!def) {
    const content = block.originalContent ?? ''
    const shortName = block.name.startsWith('core/')
      ? block.name.slice(5)
      : block.name
    return [
      `<!-- wp:${shortName} -->`,
      content,
      `<!-- /wp:${shortName} -->`,
    ].join('\n')
  }

  const serializedAttrs = serializeBlockAttributes(block.attributes, def.attributes)
  const attrsStr =
    Object.keys(serializedAttrs).length > 0
      ? ' ' + JSON.stringify(serializedAttrs)
      : ''

  // WP uses the short name without "core/" prefix
  const shortName = block.name.startsWith('core/')
    ? block.name.slice(5)
    : block.name

  // Generate the inner HTML from save()
  let innerHtml = ''
  try {
    innerHtml = def.save({ attributes: block.attributes, innerBlocks: block.innerBlocks })
  } catch {
    // save() threw — treat as void block to avoid corrupting markup
    return `<!-- wp:${shortName}${attrsStr} /-->`
  }

  const hasInnerBlocks = block.innerBlocks.length > 0
  const hasContent = innerHtml.trim() !== '' || hasInnerBlocks

  // Self-closing void block
  if (!hasContent) {
    return `<!-- wp:${shortName}${attrsStr} /-->`
  }

  // Paired block with inner block markup interleaved
  let renderedInnerHtml = innerHtml
  if (hasInnerBlocks) {
    const innerBlocksMarkup = blocksToBlockMarkup(block.innerBlocks)
    if (renderedInnerHtml.includes('<!--inner-->')) {
      renderedInnerHtml = renderedInnerHtml.replace('<!--inner-->', innerBlocksMarkup)
    } else if (renderedInnerHtml.includes('<!-- inner block -->')) {
      const perBlockMarkup = block.innerBlocks.map(blockToMarkup)
      let next = 0
      renderedInnerHtml = renderedInnerHtml.replace(
        /<!--\s*inner block\s*-->/g,
        () => perBlockMarkup[next++] ?? ''
      )
    } else if (innerBlocksMarkup.trim()) {
      renderedInnerHtml = `${renderedInnerHtml}\n${innerBlocksMarkup}`.trim()
    }
  }

  return [
    `<!-- wp:${shortName}${attrsStr} -->`,
    renderedInnerHtml,
    `<!-- /wp:${shortName} -->`,
  ].join('\n')
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Serialize a flat list of blocks to WordPress block markup
 * (the format stored in `post_content`).
 *
 * @example
 * <!-- wp:paragraph -->
 * <p class="wp-block-paragraph">Hello world</p>
 * <!-- /wp:paragraph -->
 */
export function blocksToBlockMarkup(blocks: Block[]): string {
  return blocks.map(blockToMarkup).join('\n\n')
}
