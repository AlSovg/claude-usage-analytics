export function formatCompactNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatDateShort(dateKey: string): string {
  const [, m, d] = dateKey.split('-')
  return `${d}.${m}`
}

export function formatDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
}

/** Short weekday name; `mondayIndex` 0 = Monday … 6 = Sunday. */
export function formatWeekday(mondayIndex: number, locale: string): string {
  // 2024-01-01 was a Monday.
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 1 + mondayIndex))
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
