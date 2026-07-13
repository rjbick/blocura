type StyleValue = string | number | undefined

export interface BlockStyleAttrs {
  color?: {
    text?: string
    background?: string
    gradient?: string
  }
  typography?: {
    fontSize?: string
    lineHeight?: string
    fontWeight?: string
    fontStyle?: string
    letterSpacing?: string
    textDecoration?: string
    textTransform?: string
    textColumns?: number
  }
  spacing?: {
    padding?: string | Record<string, string>
    margin?: string | Record<string, string>
    blockGap?: string
  }
  dimensions?: {
    minHeight?: string
    aspectRatio?: string
  }
  border?: {
    color?: string
    radius?: string
    style?: string
    width?: string
  }
}

export function getSupportedInlineStyleObject(
  attrs: Record<string, unknown>
): Record<string, StyleValue> {
  const style: Record<string, StyleValue> = {}
  const blockStyle = attrs['style'] as BlockStyleAttrs | undefined

  if (blockStyle?.color?.text) style['color'] = blockStyle.color.text
  if (blockStyle?.color?.background) style['backgroundColor'] = blockStyle.color.background
  if (blockStyle?.color?.gradient) style['backgroundImage'] = blockStyle.color.gradient

  if (blockStyle?.typography?.fontSize) style['fontSize'] = blockStyle.typography.fontSize
  if (blockStyle?.typography?.lineHeight) style['lineHeight'] = blockStyle.typography.lineHeight
  if (blockStyle?.typography?.fontWeight) style['fontWeight'] = blockStyle.typography.fontWeight
  if (blockStyle?.typography?.fontStyle) style['fontStyle'] = blockStyle.typography.fontStyle
  if (blockStyle?.typography?.letterSpacing) style['letterSpacing'] = blockStyle.typography.letterSpacing
  if (blockStyle?.typography?.textDecoration) style['textDecoration'] = blockStyle.typography.textDecoration
  if (blockStyle?.typography?.textTransform) style['textTransform'] = blockStyle.typography.textTransform
  if (blockStyle?.typography?.textColumns) style['columnCount'] = blockStyle.typography.textColumns

  const padding = blockStyle?.spacing?.padding
  if (padding) {
    if (typeof padding === 'string') {
      style['padding'] = padding
    } else {
      if (padding['top']) style['paddingTop'] = padding['top']
      if (padding['right']) style['paddingRight'] = padding['right']
      if (padding['bottom']) style['paddingBottom'] = padding['bottom']
      if (padding['left']) style['paddingLeft'] = padding['left']
    }
  }

  const margin = blockStyle?.spacing?.margin
  if (margin) {
    if (typeof margin === 'string') {
      style['margin'] = margin
    } else {
      if (margin['top']) style['marginTop'] = margin['top']
      if (margin['right']) style['marginRight'] = margin['right']
      if (margin['bottom']) style['marginBottom'] = margin['bottom']
      if (margin['left']) style['marginLeft'] = margin['left']
    }
  }

  if (blockStyle?.spacing?.blockGap) style['gap'] = blockStyle.spacing.blockGap
  if (blockStyle?.dimensions?.minHeight) style['minHeight'] = blockStyle.dimensions.minHeight
  if (blockStyle?.dimensions?.aspectRatio) style['aspectRatio'] = blockStyle.dimensions.aspectRatio
  if (blockStyle?.border?.color) style['borderColor'] = blockStyle.border.color
  if (blockStyle?.border?.radius) style['borderRadius'] = blockStyle.border.radius
  if (blockStyle?.border?.style) style['borderStyle'] = blockStyle.border.style
  if (blockStyle?.border?.width) style['borderWidth'] = blockStyle.border.width

  return style
}

export function readInlineStyleAttribute(node: HTMLElement): string | undefined {
  const value = node.getAttribute('style')?.trim()
  return value ? value.replace(/;\s*$/, '') : undefined
}

function cssPropertyToReactKey(property: string): string {
  if (property.startsWith('--')) return property
  return property
    .replace(/^-ms-/, 'ms-')
    .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

function reactKeyToCssProperty(key: string): string {
  if (key.startsWith('--')) return key
  return key
    .replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
    .replace(/^ms-/, '-ms-')
}

export function parseCssTextToReactStyle(cssText: string | undefined): Record<string, StyleValue> {
  if (!cssText || !cssText.trim()) return {}

  const probe = document.createElement('div')
  probe.setAttribute('style', cssText)

  const result: Record<string, StyleValue> = {}
  for (let index = 0; index < probe.style.length; index += 1) {
    const property = probe.style.item(index)
    result[cssPropertyToReactKey(property)] = probe.style.getPropertyValue(property)
  }
  return result
}

export function getCombinedInlineStyleObject(
  attrs: Record<string, unknown>,
  extraStyles: Record<string, StyleValue> = {}
): Record<string, StyleValue> {
  const rawStyle = typeof attrs['__htmlStyle'] === 'string' ? attrs['__htmlStyle'] : ''
  return {
    ...parseCssTextToReactStyle(rawStyle),
    ...getSupportedInlineStyleObject(attrs),
    ...extraStyles,
  }
}

export function styleObjectToCssText(style: Record<string, unknown>): string {
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${reactKeyToCssProperty(key)}:${String(value)}`)
    .join(';')
}

function escapeAttributeValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function serializeInlineStyleAttribute(
  attrs: Record<string, unknown>,
  extraStyles: Record<string, StyleValue> = {}
): string {
  const cssText = styleObjectToCssText(getCombinedInlineStyleObject(attrs, extraStyles))
  return cssText ? ` style="${escapeAttributeValue(cssText)}"` : ''
}
