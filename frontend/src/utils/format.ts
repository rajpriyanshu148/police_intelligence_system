/**
 * Date & time formatting utilities for the AIPAS frontend.
 * All timestamps from the FastAPI backend arrive as ISO 8601 UTC strings.
 */

/**
 * Format an ISO timestamp to a human-readable date string.
 * e.g. "2026-07-17T10:30:00Z" → "17 Jul 2026"
 */
export const formatDate = (isoString: string): string => {
  if (!isoString) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoString))
}

/**
 * Format an ISO timestamp to include time.
 * e.g. "2026-07-17T10:30:00Z" → "17 Jul 2026, 04:00 PM"
 */
export const formatDateTime = (isoString: string): string => {
  if (!isoString) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString))
}

/**
 * Return a relative time label.
 * e.g. "3 days ago", "just now", "in 2 hours"
 */
export const formatRelative = (isoString: string): string => {
  if (!isoString) return '—'
  const diff = (new Date(isoString).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  const thresholds: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [2592000, 'day'],
    [31536000, 'month'],
    [Infinity, 'year'],
  ]

  let prevThreshold = 1
  for (const [threshold, unit] of thresholds) {
    if (Math.abs(diff) < threshold) {
      return rtf.format(Math.round(diff / prevThreshold), unit)
    }
    prevThreshold = threshold
  }
  return formatDate(isoString)
}

/**
 * Truncate a string to a max length, appending ellipsis.
 */
export const truncate = (str: string, maxLength: number): string => {
  if (!str) return ''
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str
}

/**
 * Capitalize the first letter of a string.
 */
export const capitalize = (str: string): string => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert a badge status string to its semantic variant.
 */
export const getStatusVariant = (
  status: string
): 'success' | 'warning' | 'danger' | 'info' => {
  const s = status?.toUpperCase()
  if (['COMPLETED', 'APPROVED', 'CLOSED', 'ACTIVE', 'ACCEPTED'].includes(s)) return 'success'
  if (['PENDING', 'DRAFT', 'UNDER INVESTIGATION', 'REVIEWING'].includes(s)) return 'warning'
  if (['REJECTED', 'FAILED', 'SUSPENDED', 'COLD CASE'].includes(s)) return 'danger'
  return 'info'
}
