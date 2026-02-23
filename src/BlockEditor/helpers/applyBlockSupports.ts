import type { Block, BlockDefinition } from '../types'

type StyleValue = string | number | undefined

interface StyleObject {
  [key: string]: StyleValue
}

interface BlockStyleAttrs {
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

export function applyBlockSupports(
  block: Block,
  def: BlockDefinition
): { className: string; style: React.CSSProperties } {
  const attrs = block.attributes as Record<string, unknown>
  const classes: string[] = [
    `editor-block-${block.name.replace('core/', '').replace('/', '-')}`,
  ]
  const style: StyleObject = {}

  if (attrs['align']) classes.push(`align${attrs['align']}`)
  if (attrs['className']) {
    classes.push(...(attrs['className'] as string).split(' ').filter(Boolean))
  }
  if (attrs['__customCSS']) classes.push('has-custom-css')
  const hideOn = attrs['__hideOn'] as Record<string, boolean> | undefined
  if (hideOn?.desktop) classes.push('hide-on-desktop')
  if (hideOn?.tablet)  classes.push('hide-on-tablet')
  if (hideOn?.mobile)  classes.push('hide-on-mobile')

  // Colors
  if (attrs['textColor']) {
    classes.push(`has-${attrs['textColor']}-color`, 'has-text-color')
  }
  if (attrs['backgroundColor']) {
    classes.push(`has-${attrs['backgroundColor']}-background-color`, 'has-background')
  }
  if (attrs['gradient']) {
    classes.push(`has-${attrs['gradient']}-gradient-background`, 'has-background')
  }

  const blockStyle = attrs['style'] as BlockStyleAttrs | undefined

  if (blockStyle?.color?.text) style['color'] = blockStyle.color.text
  if (blockStyle?.color?.background) style['backgroundColor'] = blockStyle.color.background
  if (blockStyle?.color?.gradient) style['backgroundImage'] = blockStyle.color.gradient

  // Font size
  if (attrs['fontSize']) classes.push(`has-${attrs['fontSize']}-font-size`)
  if (blockStyle?.typography?.fontSize) style['fontSize'] = blockStyle.typography.fontSize
  if (blockStyle?.typography?.lineHeight) style['lineHeight'] = blockStyle.typography.lineHeight
  if (blockStyle?.typography?.fontWeight) style['fontWeight'] = blockStyle.typography.fontWeight
  if (blockStyle?.typography?.fontStyle) style['fontStyle'] = blockStyle.typography.fontStyle
  if (blockStyle?.typography?.letterSpacing) style['letterSpacing'] = blockStyle.typography.letterSpacing
  if (blockStyle?.typography?.textDecoration) style['textDecoration'] = blockStyle.typography.textDecoration
  if (blockStyle?.typography?.textTransform) style['textTransform'] = blockStyle.typography.textTransform
  if (blockStyle?.typography?.textColumns) {
    style['columnCount'] = blockStyle.typography.textColumns as number
  }

  // Spacing
  const padding = blockStyle?.spacing?.padding
  if (padding) {
    if (typeof padding === 'string') {
      style['padding'] = padding
    } else {
      if (padding['top'])    style['paddingTop']    = padding['top']
      if (padding['right'])  style['paddingRight']  = padding['right']
      if (padding['bottom']) style['paddingBottom'] = padding['bottom']
      if (padding['left'])   style['paddingLeft']   = padding['left']
    }
  }

  const margin = blockStyle?.spacing?.margin
  if (margin) {
    if (typeof margin === 'string') {
      style['margin'] = margin
    } else {
      if (margin['top'])    style['marginTop']    = margin['top']
      if (margin['right'])  style['marginRight']  = margin['right']
      if (margin['bottom']) style['marginBottom'] = margin['bottom']
      if (margin['left'])   style['marginLeft']   = margin['left']
    }
  }

  if (blockStyle?.spacing?.blockGap) {
    style['gap'] = blockStyle.spacing.blockGap
  }

  // Dimensions
  if (blockStyle?.dimensions?.minHeight) style['minHeight'] = blockStyle.dimensions.minHeight
  if (blockStyle?.dimensions?.aspectRatio) style['aspectRatio'] = blockStyle.dimensions.aspectRatio

  // Border
  if (blockStyle?.border?.color) style['borderColor'] = blockStyle.border.color
  if (blockStyle?.border?.radius) style['borderRadius'] = blockStyle.border.radius
  if (blockStyle?.border?.style) style['borderStyle'] = blockStyle.border.style
  if (blockStyle?.border?.width) style['borderWidth'] = blockStyle.border.width

  void def // suppress unused warning until more features are added

  return {
    className: classes.join(' '),
    style: style as React.CSSProperties,
  }
}
