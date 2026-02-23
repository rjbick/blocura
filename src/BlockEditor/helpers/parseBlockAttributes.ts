function decodeHtmlEntities(input: string): string {
  if (typeof document === 'undefined') return input
  const el = document.createElement('textarea')
  el.innerHTML = input
  return el.value
}

export function parseBlockAttributes(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {}
  const source = raw.trim()
  if (!source) return {}

  const attempts = [source, decodeHtmlEntities(source)]
  for (const value of attempts) {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // Ignore and continue trying fallbacks.
    }
  }

  return {}
}
