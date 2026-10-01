export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function formatDateShort(dateKey: string): string {
  const [, m, d] = dateKey.split('-')
  return `${d}.${m}`
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
}

/** Last path segment of `cwd` (works for both "/a/b/c" and "C:\\a\\b\\c"), falling back to the raw project slug. */
export function shortProjectName(cwd: string | null, projectSlug: string): string {
  const source = cwd?.trim()
  if (source) {
    const segments = source.split(/[\\/]/).filter(Boolean)
    if (segments.length) return segments[segments.length - 1]!
  }
  return projectSlug
}
