import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Search as SearchIcon, PackageOpen, TrendingUp, TrendingDown } from 'lucide-react'
import { springTransition } from '@/design-system/motion/motion-primitives'
import type { TableColumn } from '@/types'
import styles from './SharedComponents.module.css'

// ── 1. Avatar ─────────────────────────────────────────────────────────────

interface AvatarProps {
  name?: string
  src?: string
  size?: number
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 36, className = '' }) => {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '??'

  return (
    <div
      className={`${styles.avatar} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-label={name}
    >
      {src ? (
        <img src={src} alt={name} className={styles.avatarImg} />
      ) : (
        initials
      )}
    </div>
  )
}


// ── 2. Data Table ─────────────────────────────────────────────────────────

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  keyField: keyof T
  className?: string
}

export function Table<T extends object>({
  columns,
  data,
  keyField,
  className = '',
}: TableProps<T>) {
  return (
    <div className={`${styles.tableWrapper} ${className}`} role="table">
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className={styles.th} style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row[keyField])} className={styles.tr}>
              {columns.map((col) => (
                <td key={String(col.key)} className={styles.td}>
                  {col.render
                    ? col.render(row)
                    : String(row[col.key as keyof T] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


// ── 3. Dialog / Modal ─────────────────────────────────────────────────────

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`${styles.dialog} ${className}`}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={springTransition}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'dialog-title' : undefined}
          >
            {title && (
              <div className={styles.dialogHeader}>
                <h2 id="dialog-title" className={styles.dialogTitle}>{title}</h2>
                <button
                  className={styles.dialogClose}
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div>{children}</div>
            {footer && <div className={styles.dialogFooter}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


// ── 4. Progress Bar ───────────────────────────────────────────────────────

interface ProgressProps {
  value: number // 0–100
  className?: string
}

export const Progress: React.FC<ProgressProps> = ({ value, className = '' }) => {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      className={`${styles.progressTrack} ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={styles.progressFill} style={{ width: `${clamped}%` }} />
    </div>
  )
}


// ── 5. Empty State ────────────────────────────────────────────────────────

interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no items to display here.',
  action,
  className = '',
}) => {
  return (
    <div className={`${styles.emptyState} ${className}`}>
      <PackageOpen size={48} className={styles.emptyStateIcon} />
      <h3 className={styles.emptyStateTitle}>{title}</h3>
      <p className={styles.emptyStateDesc}>{description}</p>
      {action}
    </div>
  )
}


// ── 6. Search Input ───────────────────────────────────────────────────────

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const Search: React.FC<SearchProps> = ({ className = '', ...props }) => {
  return (
    <div className={`${styles.searchWrapper} ${className}`}>
      <SearchIcon size={16} className={styles.searchIcon} aria-hidden="true" />
      <input
        type="search"
        className={styles.searchInput}
        aria-label="Search"
        {...props}
      />
    </div>
  )
}


// ── 7. KPI Dashboard Card ─────────────────────────────────────────────────

interface KPICardProps {
  label: string
  value: string | number
  subtext?: string
  trend?: number // positive = up, negative = down
  icon?: React.ReactNode
  className?: string
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subtext,
  trend,
  icon,
  className = '',
}) => {
  return (
    <div className={`${styles.kpiCard} ${className}`}>
      <div className={styles.kpiHeader}>
        <span className={styles.kpiLabel}>{label}</span>
        {icon}
      </div>
      <div className={styles.kpiValue}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {subtext && <span className={styles.kpiSubtext}>{subtext}</span>}
        {trend !== undefined && trend !== 0 && (
          <span className={trend > 0 ? styles.kpiTrendUp : styles.kpiTrendDown}>
            {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {' '}{Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  )
}
