import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import styles from './FeedbackComponents.module.css'

// ── 1. Toast Alert Overlay List ───────────────────────────────────────────

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast()

  const getToastIcon = (type: string) => {
    if (type === 'success') return <CheckCircle size={18} color="var(--success)" />
    if (type === 'warning') return <AlertTriangle size={18} color="var(--warning)" />
    if (type === 'error') return <AlertCircle size={18} color="var(--danger)" />
    return <Info size={18} color="var(--accent)" />
  }

  const getToastClass = (type: string) => {
    if (type === 'success') return styles.toastSuccess
    if (type === 'warning') return styles.toastWarning
    if (type === 'error') return styles.toastError
    return styles.toastInfo
  }

  return (
    <div className={styles.toastContainer}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className={`${styles.toast} ${getToastClass(toast.type)}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getToastIcon(toast.type)}
              <span>{toast.message}</span>
            </div>
            <button className={styles.closeBtn} onClick={() => removeToast(toast.id)}>
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}


// ── 2. Loading Skeleton Placeholders ────────────────────────────────────────

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  borderRadius = 'var(--radius-sm)',
  className = '',
}) => {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  )
}
