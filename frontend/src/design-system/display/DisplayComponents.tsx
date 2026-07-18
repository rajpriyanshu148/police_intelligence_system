import React from 'react'
import styles from './DisplayComponents.module.css'

// ── 1. Reusable Card Component ─────────────────────────────────────────────

interface CardProps {
  title?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  actions?: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', style, actions }) => {
  return (
    <div className={`${styles.card} ${className}`} style={style}>
      {(title || actions) && (
        <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title && <h3 className={styles.cardTitle}>{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}


// ── 2. Reusable Badge Component ────────────────────────────────────────────

interface BadgeProps {
  status: 'success' | 'warning' | 'danger' | 'info'
  children: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ status, children, className = '' }) => {
  const getStatusClass = () => {
    if (status === 'success') return styles.badgeSuccess
    if (status === 'warning') return styles.badgeWarning
    if (status === 'danger') return styles.badgeDanger
    return styles.badgeInfo
  }

  return (
    <span className={`${styles.badge} ${getStatusClass()} ${className}`}>
      {children}
    </span>
  )
}


// ── 3. Reusable Timeline Component ──────────────────────────────────────────

export const Timeline: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`${styles.timeline} ${className}`}>{children}</div>
}

interface TimelineItemProps {
  title: string
  time: string
  description?: React.ReactNode
  className?: string
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  title,
  time,
  description,
  className = '',
}) => {
  return (
    <div className={`${styles.timelineItem} ${className}`}>
      <div className={styles.timelineDot} />
      <div className={styles.timelineContent}>
        <span className={styles.timelineTitle}>{title}</span>
        <span className={styles.timelineTime}>{time}</span>
        {description && <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>{description}</p>}
      </div>
    </div>
  )
}


// ── 4. Reusable Statistic Card Component ───────────────────────────────────

interface StatisticCardProps {
  label: string
  value: string | number
  className?: string
}

export const StatisticCard: React.FC<StatisticCardProps> = ({
  label,
  value,
  className = '',
}) => {
  return (
    <Card className={`${styles.statCard} ${className}`}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </Card>
  )
}
