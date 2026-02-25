import type { Block } from '../types'

interface MigrationResult<T> {
  value: T
  changed: boolean
}

const LEGACY_PREFIX = `${String.fromCharCode(119)}${String.fromCharCode(112)}-`

function migrateLegacyClassToken(token: string): string {
  if (!token.startsWith(LEGACY_PREFIX)) return token
  return `editor-${token.slice(LEGACY_PREFIX.length)}`
}

function migrateClassNameValue(className: string): MigrationResult<string> {
  const tokens = className
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)

  if (tokens.length === 0) {
    return { value: className, changed: false }
  }

  let changed = false
  const migrated = tokens.map((token) => {
    const next = migrateLegacyClassToken(token)
    if (next !== token) changed = true
    return next
  })

  return {
    value: changed ? migrated.join(' ') : className,
    changed,
  }
}

export function migrateLegacyHtmlClasses(html: string): MigrationResult<string> {
  if (!html || !html.includes(LEGACY_PREFIX)) {
    return { value: html, changed: false }
  }

  const container = document.createElement('div')
  container.innerHTML = html

  let changed = false
  const elements = container.querySelectorAll('[class]')
  for (const element of elements) {
    const classAttr = element.getAttribute('class')
    if (!classAttr) continue
    const migrated = migrateClassNameValue(classAttr)
    if (!migrated.changed) continue
    element.setAttribute('class', migrated.value)
    changed = true
  }

  return {
    value: changed ? container.innerHTML : html,
    changed,
  }
}

function migrateLegacyBlockClassesInternal(block: Block): MigrationResult<Block> {
  let changed = false

  const attrs = (block.attributes as Record<string, unknown> | undefined) ?? {}
  let nextAttrs = block.attributes
  const className = attrs.className
  if (typeof className === 'string' && className.includes(LEGACY_PREFIX)) {
    const migrated = migrateClassNameValue(className)
    if (migrated.changed) {
      nextAttrs = {
        ...attrs,
        className: migrated.value,
      } as Block['attributes']
      changed = true
    }
  }

  let nextInnerBlocks = block.innerBlocks
  if (block.innerBlocks.length > 0) {
    const migratedInner = block.innerBlocks.map(migrateLegacyBlockClassesInternal)
    if (migratedInner.some((entry) => entry.changed)) {
      nextInnerBlocks = migratedInner.map((entry) => entry.value)
      changed = true
    }
  }

  if (!changed) {
    return { value: block, changed: false }
  }

  return {
    value: {
      ...block,
      attributes: nextAttrs,
      innerBlocks: nextInnerBlocks,
    },
    changed: true,
  }
}

export function migrateLegacyBlockClasses(blocks: Block[]): MigrationResult<Block[]> {
  if (blocks.length === 0) {
    return { value: blocks, changed: false }
  }

  const migrated = blocks.map(migrateLegacyBlockClassesInternal)
  const changed = migrated.some((entry) => entry.changed)
  return {
    value: changed ? migrated.map((entry) => entry.value) : blocks,
    changed,
  }
}
