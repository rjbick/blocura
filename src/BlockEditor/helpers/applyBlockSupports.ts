import type { Block, BlockDefinition } from '../types'
import { getCombinedInlineStyleObject } from './inlineStyles'

export function applyBlockSupports(
  block: Block,
  def: BlockDefinition
): { className: string; style: React.CSSProperties } {
  const attrs = block.attributes as Record<string, unknown>
  const blockClassSuffix = block.name
    .replace(/^core\//, '')
    .replace(/\//g, '-')
  const classes: string[] = [
    `editor-block-${blockClassSuffix}`,
  ]
  const style = getCombinedInlineStyleObject(attrs)

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

  // Font size
  if (attrs['fontSize']) classes.push(`has-${attrs['fontSize']}-font-size`)
  void def // suppress unused warning until more features are added

  return {
    className: classes.join(' '),
    style: style as React.CSSProperties,
  }
}
