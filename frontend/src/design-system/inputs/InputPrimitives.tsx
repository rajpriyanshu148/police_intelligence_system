import React from 'react'
import styles from './InputPrimitives.module.css'

// ── 1. Reusable Button Component ──────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantClass = () => {
    if (variant === 'secondary') return styles.btnSecondary
    if (variant === 'danger') return styles.btnDanger
    return styles.btnPrimary
  };

  const isDisabled = disabled || loading

  return (
    <button
      className={`${styles.btn} ${getVariantClass()} ${isDisabled ? styles.btnDisabled : ''} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <span>Loading...</span> : children}
    </button>
  )
}


// ── 2. Reusable TextInput Component ────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className={styles.formGroup}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <input
        id={id}
        className={`${styles.control} ${error ? styles.controlError : ''} ${className}`}
        {...props}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  )
}


// ── 3. Reusable Dropdown Select Component ───────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Array<{ value: string; label: string }>
  error?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className={styles.formGroup}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <select
        id={id}
        className={`${styles.control} ${error ? styles.controlError : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  )
}


// ── 4. Reusable TextArea Component ─────────────────────────────────────────

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className={styles.formGroup}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <textarea
        id={id}
        className={`${styles.control} ${error ? styles.controlError : ''} ${className}`}
        {...props}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  )
}
