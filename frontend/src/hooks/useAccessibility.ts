import { useEffect, useRef, useCallback } from 'react'

/**
 * Detects if the user prefers reduced motion via OS settings.
 * Use this to skip or simplify animations for accessibility compliance.
 */
export const usePrefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Focus trap hook for modals and drawers.
 * Traps keyboard focus within a container and restores it on close.
 */
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive) return

    // Save previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement

    const container = containerRef.current
    if (!container) return

    // Query all focusable elements inside the container
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    )

    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus on close
      previousFocusRef.current?.focus()
    }
  }, [isActive])

  return containerRef
}

/**
 * Hook to close a panel/modal on Escape key press.
 */
export const useEscapeKey = (onEscape: () => void, isActive = true) => {
  useEffect(() => {
    if (!isActive) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape()
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onEscape, isActive])
}

/**
 * Returns a screen-reader only class style object.
 * Use for visually hidden but accessible labels.
 */
export const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
}

/**
 * Generate a unique ID for aria- associations (labels, descriptions).
 * Stable across renders via useRef.
 */
export const useAriaId = (prefix = 'aipas') => {
  const id = useRef(`${prefix}-${Math.random().toString(36).slice(2, 9)}`)
  return id.current
}

/**
 * Announce a message to screen readers using a live region.
 */
export const useAnnounce = () => {
  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const el = document.createElement('div')
    el.setAttribute('aria-live', politeness)
    el.setAttribute('aria-atomic', 'true')
    el.style.position = 'absolute'
    el.style.width = '1px'
    el.style.height = '1px'
    el.style.overflow = 'hidden'
    el.style.clip = 'rect(0,0,0,0)'
    document.body.appendChild(el)

    setTimeout(() => {
      el.textContent = message
    }, 50)

    setTimeout(() => {
      document.body.removeChild(el)
    }, 2000)
  }, [])

  return announce
}
