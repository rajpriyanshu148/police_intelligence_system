import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeChoice = 'light' | 'dark' | 'system'

interface ThemeState {
  themeChoice: ThemeChoice
  setTheme: (choice: ThemeChoice) => void
  resolvedTheme: 'light' | 'dark'
  resolveTheme: (choice: ThemeChoice) => 'light' | 'dark'
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeChoice: 'system',
      resolvedTheme: 'light',
      setTheme: (choice: ThemeChoice) => {
        set({ themeChoice: choice })
        const resolved = get().resolveTheme(choice)
        set({ resolvedTheme: resolved })
        document.documentElement.setAttribute('data-theme', resolved)
      },
      resolveTheme: (choice: ThemeChoice): 'light' | 'dark' => {
        if (choice === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        return choice
      }
    }),
    {
      name: 'aipas-theme-store',
      partialize: (state) => ({ themeChoice: state.themeChoice })
    }
  )
)

// Initialize system scheme listener
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleSchemeChange = () => {
    const choice = useTheme.getState().themeChoice
    if (choice === 'system') {
      const resolved = mediaQuery.matches ? 'dark' : 'light'
      useTheme.setState({ resolvedTheme: resolved })
      document.documentElement.setAttribute('data-theme', resolved)
    }
  }
  
  mediaQuery.addEventListener('change', handleSchemeChange)
  
  // Set initial resolved state
  setTimeout(() => {
    const choice = useTheme.getState().themeChoice
    const resolved = choice === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : choice
    useTheme.setState({ resolvedTheme: resolved })
    document.documentElement.setAttribute('data-theme', resolved)
  }, 0)
}
