import type { Block } from '../types'
import { generateClientId } from './generateClientId'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeBlock(value: unknown): Block | null {
  if (!isRecord(value)) return null
  if (typeof value.name !== 'string' || !value.name.trim()) return null

  const clientId =
    typeof value.clientId === 'string' && value.clientId.trim()
      ? value.clientId
      : generateClientId()

  const attributes = isRecord(value.attributes) ? { ...value.attributes } : {}
  const rawInnerBlocks = Array.isArray(value.innerBlocks) ? value.innerBlocks : []
  const innerBlocks = rawInnerBlocks
    .map(normalizeBlock)
    .filter((block): block is Block => block !== null)

  const normalized: Block = {
    clientId,
    name: value.name,
    attributes,
    innerBlocks,
  }

  if (typeof value.isValid === 'boolean') {
    normalized.isValid = value.isValid
  }
  if (typeof value.originalContent === 'string') {
    normalized.originalContent = value.originalContent
  }

  return normalized
}

function normalizeBlocks(input: unknown): Block[] {
  if (!Array.isArray(input)) return []
  return input
    .map(normalizeBlock)
    .filter((block): block is Block => block !== null)
}

export function parseBlocksJson(input: Block[] | string | undefined): Block[] {
  if (input === undefined) return []
  if (typeof input !== 'string') return normalizeBlocks(input)

  const trimmed = input.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (isRecord(parsed) && Array.isArray(parsed.blocks)) {
      return normalizeBlocks(parsed.blocks)
    }
    return normalizeBlocks(parsed)
  } catch {
    return []
  }
}
