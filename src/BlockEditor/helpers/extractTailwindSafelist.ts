import type { Block } from '../types'

function tokenizeClassName(className: string): string[] {
  return className
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !token.startsWith('editor-'))
}

function collectClassTokensFromHtml(html: string): string[] {
  if (!html || !html.trim()) return []

  if (typeof document !== 'undefined') {
    const container = document.createElement('div')
    container.innerHTML = html
    const tokens: string[] = []
    for (const node of container.querySelectorAll('[class]')) {
      const className = node.getAttribute('class')
      if (!className) continue
      tokens.push(...tokenizeClassName(className))
    }
    return tokens
  }

  const tokens: string[] = []
  const regex = /class\s*=\s*["']([^"']+)["']/g
  let match: RegExpExecArray | null = regex.exec(html)
  while (match) {
    const className = match[1]
    if (className) tokens.push(...tokenizeClassName(className))
    match = regex.exec(html)
  }
  return tokens
}

function collectFromBlock(block: Block, safelist: Set<string>): void {
  const attrs = block.attributes as Record<string, unknown>
  const className = attrs['className']
  if (typeof className === 'string' && className.trim()) {
    for (const token of tokenizeClassName(className)) {
      safelist.add(token)
    }
  }

  // Custom HTML blocks can contain utility classes not represented in attributes.className.
  if (block.name === 'core/html') {
    const html = attrs['content']
    if (typeof html === 'string') {
      for (const token of collectClassTokensFromHtml(html)) {
        safelist.add(token)
      }
    }
  }

  for (const inner of block.innerBlocks) {
    collectFromBlock(inner, safelist)
  }
}

export function extractTailwindSafelist(blocks: Block[]): string[] {
  const safelist = new Set<string>()
  for (const block of blocks) {
    collectFromBlock(block, safelist)
  }
  return Array.from(safelist).sort((a, b) => a.localeCompare(b))
}
