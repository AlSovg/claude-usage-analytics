/** Local calendar-day key (YYYY-MM-DD) used to bucket activity. Returns null for invalid input. */
export function toDateKey(input: string | number | Date): string | null {
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
