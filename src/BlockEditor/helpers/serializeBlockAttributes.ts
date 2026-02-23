import type { BlockAttributeSchema } from '../types'

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === undefined || b === undefined) return false
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

export function toSerializableBlockAttributes(
  attributes: Record<string, unknown>,
  schema: Record<string, BlockAttributeSchema> = {}
): Record<string, unknown> {
  const output: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(attributes)) {
    if (key.startsWith('__')) continue
    if (value === undefined || value === null || value === '') continue

    const defaultValue = schema[key]?.default
    if (defaultValue !== undefined && isEqual(defaultValue, value)) continue

    output[key] = value
  }

  return output
}

export function serializeBlockAttributes(
  attributes: Record<string, unknown>,
  schema: Record<string, BlockAttributeSchema> = {}
): string {
  const serializable = toSerializableBlockAttributes(attributes, schema)
  return Object.keys(serializable).length > 0
    ? JSON.stringify(serializable)
    : ''
}
