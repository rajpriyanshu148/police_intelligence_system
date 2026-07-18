import { create } from 'zustand'

export interface ToastAlert {
  id: string
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
}

interface ToastState {
  toasts: ToastAlert[]
  addToast: (message: string, type?: ToastAlert['type']) => void
  removeToast: (id: string) => void
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 4000)
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))
