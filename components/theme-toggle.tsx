'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="group flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all duration-300 hover:border-[#38b6ff]/35 hover:bg-[#38b6ff]/10 hover:shadow-[0_0_22px_rgba(56,182,255,0.18)] active:scale-95"
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-yellow-300 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110" />
      ) : (
        <Moon className="h-4 w-4 text-blue-200 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
      )}
    </button>
  )
}