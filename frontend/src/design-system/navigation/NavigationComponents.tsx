import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { springTransition } from '@/design-system/motion/motion-primitives'
import type { BreadcrumbItem, SelectOption } from '@/types'
import styles from './NavigationComponents.module.css'

// ── 1. Tabs ───────────────────────────────────────────────────────────────

interface TabsProps {
  tabs: SelectOption[]
  activeTab: string
  onChange: (value: string) => void
  children?: React.ReactNode
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, children }) => {
  return (
    <div className={styles.tabs}>
      <div className={styles.tabList} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={activeTab === tab.value}
            className={`${styles.tab} ${activeTab === tab.value ? styles.tabActive : ''}`}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{children}</div>
    </div>
  )
}


// ── 2. Breadcrumb ─────────────────────────────────────────────────────────

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <div key={item.label} className={styles.breadcrumbItem}>
            {idx > 0 && <ChevronRight size={14} aria-hidden="true" />}
            {isLast || !item.href ? (
              <span
                className={isLast ? styles.breadcrumbCurrent : styles.breadcrumbLink}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link to={item.href} className={styles.breadcrumbLink}>
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}


// ── 3. Dropdown ───────────────────────────────────────────────────────────

export interface DropdownMenuItem {
  label: string
  onClick?: () => void
  icon?: React.ReactNode
  divider?: boolean
  danger?: boolean
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownMenuItem[]
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className={styles.dropdownWrapper}>
      <div onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={springTransition}
            className={styles.dropdownMenu}
          >
            {items.map((item, idx) =>
              item.divider ? (
                <div key={idx} className={styles.dropdownDivider} />
              ) : (
                <div
                  key={item.label}
                  className={styles.dropdownItem}
                  style={item.danger ? { color: 'var(--danger)' } : undefined}
                  onClick={() => {
                    item.onClick?.()
                    setOpen(false)
                  }}
                >
                  {item.icon}
                  {item.label}
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
