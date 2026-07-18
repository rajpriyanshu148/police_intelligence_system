import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Emil Kowalski snappy spring physics defaults
// eslint-disable-next-line react-refresh/only-export-components
export const springTransition = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
  mass: 1,
}

interface MotionProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const PageTransition: React.FC<MotionProps> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} // Snappy bezier
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const ModalTransition: React.FC<MotionProps & { isOpen: boolean }> = ({
  children,
  isOpen,
  className,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={springTransition}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const DrawerTransition: React.FC<MotionProps & { isOpen: boolean }> = ({
  children,
  isOpen,
  className,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={springTransition}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const HoverScale: React.FC<MotionProps> = ({ children, className, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'inherit' }}
    >
      {children}
    </motion.div>
  )
}

export const ListTransition: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const ListItemTransition: React.FC<MotionProps> = ({ children, className }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: springTransition },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className,
}) => {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2px solid var(--card-border)',
        borderTopColor: 'var(--primary)',
      }}
      className={className}
    />
  )
}
